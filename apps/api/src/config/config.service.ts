import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  get databaseUrl(): string { return process.env.DATABASE_URL!; }
  get redisUrl(): string { return process.env.REDIS_URL ?? 'redis://localhost:6379'; }
  get clerkSecretKey(): string { return process.env.CLERK_SECRET_KEY!; }
  get anthropicKey(): string { return process.env.ANTHROPIC_API_KEY!; }
  get stripeKey(): string { return process.env.STRIPE_SECRET_KEY!; }
  get razorpayKey(): string { return process.env.RAZORPAY_KEY_ID!; }
  get razorpaySecret(): string { return process.env.RAZORPAY_KEY_SECRET!; }
  get jwtSecret(): string { return process.env.JWT_SECRET ?? 'changeme'; }
  get meilisearchUrl(): string { return process.env.MEILISEARCH_URL ?? 'http://localhost:7700'; }
  get meilisearchKey(): string { return process.env.MEILISEARCH_KEY ?? ''; }
  get isProduction(): boolean { return process.env.NODE_ENV === 'production'; }
  get port(): number { return parseInt(process.env.PORT ?? '3001', 10); }
}
