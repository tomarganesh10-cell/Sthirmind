import { Module } from '@nestjs/common';
import { HappinessController } from './happiness.controller';
import { HappinessService } from './happiness.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [HappinessController],
  providers: [HappinessService],
  exports: [HappinessService],
})
export class HappinessModule {}
