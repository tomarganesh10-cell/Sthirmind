import { Module } from '@nestjs/common';
import { HopeController } from './hope.controller';
import { HopeService } from './hope.service';
import { UsersModule } from '../users/users.module';

@Module({ imports: [UsersModule], controllers: [HopeController], providers: [HopeService], exports: [HopeService] })
export class HopeModule {}
