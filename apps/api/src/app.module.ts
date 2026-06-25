import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { HeartModule } from './modules/heart/heart.module';
import { HopeModule } from './modules/hope/hope.module';
import { HealthModule } from './modules/health/health.module';
import { HelpModule } from './modules/help/help.module';
import { HappinessModule } from './modules/happiness/happiness.module';
import { AiModule } from './modules/ai/ai.module';
import { CommunityModule } from './modules/community/community.module';
import { ContentModule } from './modules/content/content.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: 60000,
        limit: config.get('RATE_LIMIT_PER_MINUTE', 100),
      }]),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    AssessmentModule,
    HeartModule,
    HopeModule,
    HealthModule,
    HelpModule,
    HappinessModule,
    AiModule,
    CommunityModule,
    ContentModule,
    AnalyticsModule,
    AdminModule,
    SubscriptionsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
