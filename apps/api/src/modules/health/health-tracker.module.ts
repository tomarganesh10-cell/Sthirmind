import { Module } from '@nestjs/common';
import { HealthTrackerController } from './health-tracker.controller';
import { HealthTrackerService } from './health-tracker.service';
import { UsersModule } from '../users/users.module';

@Module({ imports: [UsersModule], controllers: [HealthTrackerController], providers: [HealthTrackerService], exports: [HealthTrackerService] })
export class HealthTrackerModule {}
