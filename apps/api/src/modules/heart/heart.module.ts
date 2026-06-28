import { Module } from '@nestjs/common';
import { HeartController } from './heart.controller';
import { HeartService } from './heart.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [HeartController],
  providers: [HeartService],
  exports: [HeartService],
})
export class HeartModule {}
