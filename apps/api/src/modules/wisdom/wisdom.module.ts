import { Module } from '@nestjs/common';
import { WisdomController } from './wisdom.controller';
import { WisdomService } from './wisdom.service';
import { WisdomAiService } from './wisdom-ai.service';
import { WisdomAudioService } from './wisdom-audio.service';
import { WisdomAnalyticsService } from './wisdom-analytics.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [WisdomController],
  providers: [WisdomService, WisdomAiService, WisdomAudioService, WisdomAnalyticsService],
  exports: [WisdomService, WisdomAiService],
})
export class WisdomModule {}
