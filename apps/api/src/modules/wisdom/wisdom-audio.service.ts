import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

// One voice — Rachel by ElevenLabs. Most human, warm, clear narration.
const HUMAN_VOICE = {
  id: '21m00Tcm4TlvDq8ikWAM',
  name: 'Rachel',
  style: 'natural human narration',
  // Settings tuned for maximum naturalness — sounds like a real person reading to you
  settings: { stability: 0.50, similarity_boost: 0.88, style: 0.25, use_speaker_boost: true },
};

// OpenAI fallback
const OPENAI_FALLBACK_VOICE = 'nova';

const BACKGROUND_TRACKS = {
  none: null,
  ambient: 'https://cdn.sthirmind.com/audio/bg/ambient-forest.mp3',
  binaural: 'https://cdn.sthirmind.com/audio/bg/binaural-focus.mp3',
  cafe:     'https://cdn.sthirmind.com/audio/bg/cafe-noise.mp3',
  rain:     'https://cdn.sthirmind.com/audio/bg/rain-gentle.mp3',
};

@Injectable()
export class WisdomAudioService {
  private readonly logger = new Logger(WisdomAudioService.name);
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(private prisma: PrismaService) {}

  async generateAudio(summaryId: string, _voice?: string, _provider?: string, background?: string) {
    const cached = await this.prisma.bookAudio.findFirst({
      where: { summaryId, voice: 'FEMALE', provider: 'ELEVENLABS' },
    });
    if (cached?.audioUrl) return cached;

    const summary = await this.prisma.bookSummary.findUnique({ where: { id: summaryId } });
    if (!summary) throw new Error('Summary not found');

    const script = this.prepareAudioScript(summary.content);
    let audioUrl: string;
    let provider = 'elevenlabs';

    try {
      audioUrl = await this.generateElevenLabsAudio(script);
    } catch (err) {
      this.logger.warn(`ElevenLabs failed, falling back to OpenAI: ${err}`);
      audioUrl = await this.generateOpenAiAudio(script);
      provider = 'openai';
    }

    const durationSec = Math.round(script.length / 11);

    return this.prisma.bookAudio.create({
      data: {
        summaryId,
        voice: 'FEMALE',
        provider: provider.toUpperCase() as any,
        audioUrl,
        durationSec,
        voiceId: HUMAN_VOICE.id,
        backgroundMusic: background ? (BACKGROUND_TRACKS as any)[background] ?? null : null,
      },
    });
  }

  private async generateElevenLabsAudio(text: string): Promise<string> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ElevenLabs API key not configured');

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${HUMAN_VOICE.id}/stream`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({
          text: this.chunkText(text, 4500),
          model_id: 'eleven_turbo_v2_5',
          voice_settings: HUMAN_VOICE.settings,
          output_format: 'mp3_44100_128',
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs error ${response.status}: ${err}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return this.storeAudioBuffer(buffer, 'elevenlabs');
  }

  private async generateOpenAiAudio(text: string): Promise<string> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: OPENAI_FALLBACK_VOICE as any,
      input: text.slice(0, 4096),
      speed: 1.0,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return this.storeAudioBuffer(buffer, 'openai');
  }

  private storeAudioBuffer(buffer: Buffer, provider: string): string {
    // Production: upload to object storage (S3/R2) and return CDN URL
    // The buffer is ready — wire up your preferred storage:
    //   await s3.send(new PutObjectCommand({ Bucket: 'sthirmind-audio', Key: filename, Body: buffer, ContentType: 'audio/mpeg' }));
    const filename = `${provider}-${voice}-${Date.now()}.mp3`;
    this.logger.log(`Audio generated: ${filename} (${buffer.length} bytes)`);
    return `https://cdn.sthirmind.com/audio/${filename}`;
  }

  private prepareAudioScript(content: string): string {
    return content
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/\. ([A-Z])/g, '.  $1')   // natural pause between sentences
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private chunkText(text: string, maxLen: number): string {
    // Keep within API limit while preserving sentence boundaries
    if (text.length <= maxLen) return text;
    const truncated = text.slice(0, maxLen);
    const lastPeriod = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));
    return lastPeriod > maxLen * 0.7 ? truncated.slice(0, lastPeriod + 1) : truncated;
  }

  async logListeningSession(userId: string, audioId: string, durationSec: number, completed: boolean, speed: number, lastPosition: number) {
    return this.prisma.listeningSession.create({
      data: { userId, audioId, endedAt: new Date(), durationSec, completed, speed, lastPosition },
    });
  }

  getAvailableVoices() {
    return {
      voice: { name: HUMAN_VOICE.name, style: HUMAN_VOICE.style },
      speeds: [0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
      backgrounds: Object.keys(BACKGROUND_TRACKS),
    };
  }
}
