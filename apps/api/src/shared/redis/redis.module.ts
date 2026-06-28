import { Global, Module } from '@nestjs/common';

// Redis is optional — the app works without it (caching degrades gracefully)
// Wire up ioredis or @nestjs/cache-manager here when REDIS_URL is configured

@Global()
@Module({
  providers: [],
  exports: [],
})
export class RedisModule {}
