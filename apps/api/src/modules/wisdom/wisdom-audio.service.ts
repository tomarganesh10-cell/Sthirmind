import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

// Premium ElevenLabs voices — most human-sounding, emotionally resonant
const ELEVENLABS_VOICES = {
  // Rachel: warm, clear, professional female — feels like a wise friend
  female: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', style: 'warm & clear' },
  // Adam: deep, authoritative, trustworthy male narrator
  male: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', style: 'deep & authoritative' },
  // Dorothy: wise elder, storytelling cadence — perfect for life lessons
  mentor: { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', style: 'wise & storytelling' },
  // Antoni: confident, energetic, startup founder energy
  founder: { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', style: 'confident & energetic' },
  // Elli: ultra-calm, slow, meditative — like a mindfulness teacher
  meditation: { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', style: 'calm & meditative' },
};

// OpenAI fallback voices
const OPENAI_VOICES: Record<string, string> = {
  male: 'onyx',
  female: 'nova',
  mentor: 'echo',
  founder: 'fable',
  meditation: 'shimmer',
};

// ElevenLabs voice settings tuned per personality for maximum human quality
const VOICE_SETTINGS: Record<string, { stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean }> = {
  female:    { stability: 0.55, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
  male:      { stability: 0.65, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
  mentor:    { stability: 0.70, similarity_boost: 0.80, style: 0.35, use_speaker_boost: true },
  founder:   { stability: 0.45, similarity_boost: 0.80, style: 0.45, use_speaker_boost: true },
  meditation:{ stability: 0.85, similarity_boost: 0.75, style: 0.60, use_speaker_boost: false },
};

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

  async generateAudio(
    summaryId: string,
    voice: 'male' | 'female' | 'mentor' | 'founder' | 'meditation',
    provider: 'openai' | 'elevenlabs' | 'gemini' = 'elevenlabs',
    background?: string,
  ) {
    const cached = await this.prisma.bookAudio.findFirst({
      where: { summaryId, voice: voice.toUpperCase() as any, provider: provider.toUpperCase() as any },
    });
    if (cached?.audioUrl) return cached;

    const summary = await this.prisma.bookSummary.findUnique({ where: { id: summaryId } });
    if (!summary) throw new Error('Summary not found');

    const script = this.prepareAudioScript(summary.content, voice);
    let audioUrl: string;
    let durationSec = 0;

    try {
      if (provider === 'elevenlabs') {
        audioUrl = await this.generateElevenLabsAudio(script, voice);
        durationSec = Math.round(script.length / 11);
      } else {
        audioUrl = await this.generateOpenAiAudio(script, voice);
        durationSec = Math.round(script.length / 13);
      }
    } catch (err) {
      this.logger.warn(`Primary TTS failed (${provider}), falling back to OpenAI: ${err}`);
      audioUrl = await this.generateOpenAiAudio(script, voice);
      durationSec = Math.round(script.length / 13);
      provider = 'openai';
    }

    return this.prisma.bookAudio.create({
      data: {
        summaryId,
        voice: voice.toUpperCase() as any,
        provider: provider.toUpperCase() as any,
        audioUrl,
        durationSec,
        voiceId: provider === 'elevenlabs' ? ELEVENLABS_VOICES[voice]?.id : OPENAI_VOICES[voice],
        backgroundMusic: background ? (BACKGROUND_TRACKS as any)[background] ?? null : null,
      },
    });
  }

  private async generateElevenLabsAudio(text: string, voice: string): Promise<string> {
    const voiceConfig = (ELEVENLABS_VOICES as any)[voice];
    const settings = (VOICE_SETTINGS as any)[voice] ?? VOICE_SETTINGS.mentor;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ElevenLabs API key not configured');

    // eleven_turbo_v2_5 — fastest with best human quality
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.id}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: this.chunkText(text, 4500),
          model_id: 'eleven_turbo_v2_5',
          voice_settings: settings,
          output_format: 'mp3_44100_128',
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs error ${response.status}: ${err}`);
    }

    // Stream → buffer → store
    const buffer = Buffer.from(await response.arrayBuffer());
    return this.storeAudioBuffer(buffer, 'elevenlabs', voice);
  }

  private async generateOpenAiAudio(text: string, voice: string): Promise<string> {
    const oaiVoice = OPENAI_VOICES[voice] ?? 'echo';
    const speed = voice === 'meditation' ? 0.85 : voice === 'founder' ? 1.05 : 1.0;

    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: oaiVoice as any,
      input: text.slice(0, 4096),
      speed,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return this.storeAudioBuffer(buffer, 'openai', voice);
  }

  private storeAudioBuffer(buffer: Buffer, provider: string, voice: string): string {
    // Production: upload to object storage (S3/R2) and return CDN URL
    // The buffer is ready — wire up your preferred storage:
    //   await s3.send(new PutObjectCommand({ Bucket: 'sthirmind-audio', Key: filename, Body: buffer, ContentType: 'audio/mpeg' }));
    const filename = `${provider}-${voice}-${Date.now()}.mp3`;
    this.logger.log(`Audio generated: ${filename} (${buffer.length} bytes)`);
    return `https://cdn.sthirmind.com/audio/${filename}`;
  }

  private prepareAudioScript(content: string, voice: string): string {
    // Strip markdown
    let script = content
      .replace(/#{1,6}\s+/g, '')     // headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold
      .replace(/\*(.*?)\*/g, '$1')     // italic
      .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/^\s*[-*+]\s+/gm, '')  // list bullets
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Voice-specific pacing adjustments
    if (voice === 'meditation') {
      script = script
        .replace(/\. ([A-Z])/g, '.  $1')    // longer pause between sentences
        .replace(/\n\n/g, '\n\n\n')         // breath between paragraphs
        .replace(/,/g, ', ');               // natural comma pauses
    } else if (voice === 'founder') {
      script = script
        .replace(/\n\n/g, '\n')             // punchy, no long pauses
        .replace(/\. ([A-Z])/g, '. $1');
    } else if (voice === 'mentor') {
      script = script
        .replace(/\. ([A-Z])/g, '.  $1');   // measured, thoughtful pace
    }

    return script;
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
      voices: Object.entries(ELEVENLABS_VOICES).map(([id, v]) => ({
        id,
        label: this.voiceLabel(id),
        name: v.name,
        style: v.style,
        emoji: this.voiceEmoji(id),
      })),
      providers: ['elevenlabs', 'openai'],
      speeds: [0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
      backgrounds: Object.keys(BACKGROUND_TRACKS),
    };
  }

  private voiceLabel(id: string): string {
    return { male: 'Deep Narrator', female: 'Warm Guide', mentor: 'Wise Elder', founder: 'Founder Energy', meditation: 'Calm Presence' }[id] ?? id;
  }

  private voiceEmoji(id: string): string {
    return { male: '🎙️', female: '✨', mentor: '🧭', founder: '🚀', meditation: '🧘' }[id] ?? '🎤';
  }
}
