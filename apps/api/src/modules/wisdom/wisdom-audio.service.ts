import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

// Voice configurations per provider
const VOICE_MAP = {
  openai: {
    male: 'onyx',
    female: 'nova',
    mentor: 'echo',
    founder: 'fable',
    meditation: 'shimmer',
  },
  elevenlabs: {
    male: 'pNInz6obpgDQGcFmaJgB',          // Adam
    female: 'EXAVITQu4vr4xnSDxMaL',         // Bella
    mentor: 'VR6AewLTigWG4xSOukaG',          // Arnold
    founder: 'yoZ06aMxZJJ28mfd3POQ',         // Sam
    meditation: 'MF3mGyEYCl7XYWbV9V6O',     // Elli (calm)
  },
};

const BACKGROUND_TRACKS = {
  none: null,
  ambient: 'https://cdn.sthirmind.com/audio/bg/ambient-forest.mp3',
  binaural: 'https://cdn.sthirmind.com/audio/bg/binaural-focus.mp3',
  cafe: 'https://cdn.sthirmind.com/audio/bg/cafe-noise.mp3',
  rain: 'https://cdn.sthirmind.com/audio/bg/rain-gentle.mp3',
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
    // Check cache
    const cached = await this.prisma.bookAudio.findFirst({
      where: { summaryId, voice: voice.toUpperCase() as any, provider: provider.toUpperCase() as any },
    });
    if (cached?.audioUrl) return cached;

    const summary = await this.prisma.bookSummary.findUnique({ where: { id: summaryId } });
    if (!summary) throw new Error('Summary not found');

    // Prepare SSML-enhanced script
    const script = this.prepareAudioScript(summary.content, voice);

    let audioUrl: string;
    let durationSec = 0;

    if (provider === 'openai') {
      audioUrl = await this.generateOpenAiAudio(script, voice);
      durationSec = Math.round(script.length / 13); // ~13 chars/sec at normal pace
    } else if (provider === 'elevenlabs') {
      audioUrl = await this.generateElevenLabsAudio(script, voice);
      durationSec = Math.round(script.length / 12);
    } else {
      // Gemini TTS — use OpenAI as fallback until Gemini TTS is GA
      audioUrl = await this.generateOpenAiAudio(script, voice);
      durationSec = Math.round(script.length / 13);
    }

    const audio = await this.prisma.bookAudio.create({
      data: {
        summaryId,
        voice: voice.toUpperCase() as any,
        provider: provider.toUpperCase() as any,
        audioUrl,
        durationSec,
        voiceId: (VOICE_MAP[provider] as any)[voice],
        backgroundMusic: background ? (BACKGROUND_TRACKS as any)[background] : null,
      },
    });

    return audio;
  }

  private async generateOpenAiAudio(text: string, voice: string): Promise<string> {
    const oaiVoice = (VOICE_MAP.openai as any)[voice] ?? 'echo';

    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: oaiVoice,
      input: text.slice(0, 4096), // OpenAI TTS limit
      speed: 1.0,
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    // In production: upload to S3 and return URL
    // For now return a placeholder URL pattern
    const filename = `wisdom-audio-${Date.now()}.mp3`;
    // await s3.upload({ Bucket: 'sthirmind-audio', Key: filename, Body: buffer }).promise();
    return `https://cdn.sthirmind.com/audio/${filename}`;
  }

  private async generateElevenLabsAudio(text: string, voice: string): Promise<string> {
    const voiceId = (VOICE_MAP.elevenlabs as any)[voice];
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ElevenLabs API key not configured');

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 5000),
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.71, similarity_boost: 0.75, style: voice === 'meditation' ? 0.5 : 0.3 },
        }),
      }
    );

    if (!response.ok) throw new Error(`ElevenLabs error: ${response.statusText}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `wisdom-11labs-${Date.now()}.mp3`;
    return `https://cdn.sthirmind.com/audio/${filename}`;
  }

  private prepareAudioScript(content: string, voice: string): string {
    // Add natural pauses and pacing based on voice type
    let script = content;

    if (voice === 'meditation') {
      // Slower, more contemplative
      script = script.replace(/\. /g, '... ').replace(/\n\n/g, '\n\n...\n\n');
    } else if (voice === 'founder') {
      // More energetic, direct
      script = script.replace(/\n\n/g, '\n');
    }

    // Remove markdown formatting
    script = script.replace(/[#*_`]/g, '').replace(/\n{3,}/g, '\n\n').trim();

    return script;
  }

  async logListeningSession(userId: string, audioId: string, durationSec: number, completed: boolean, speed: number, lastPosition: number) {
    return this.prisma.listeningSession.create({
      data: { userId, audioId, endedAt: new Date(), durationSec, completed, speed, lastPosition },
    });
  }

  getAvailableVoices() {
    return {
      voices: [
        { id: 'male', label: 'Professional Male', emoji: '👨', sample: 'Deep, clear, authoritative' },
        { id: 'female', label: 'Professional Female', emoji: '👩', sample: 'Warm, clear, engaging' },
        { id: 'mentor', label: 'Mentor Voice', emoji: '🧭', sample: 'Wise, measured, trustworthy' },
        { id: 'founder', label: 'Founder Voice', emoji: '🚀', sample: 'Energetic, direct, inspiring' },
        { id: 'meditation', label: 'Calm Meditation', emoji: '🧘', sample: 'Slow, soothing, contemplative' },
      ],
      providers: ['openai', 'elevenlabs', 'gemini'],
      speeds: [0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
      backgrounds: Object.keys(BACKGROUND_TRACKS),
    };
  }
}
