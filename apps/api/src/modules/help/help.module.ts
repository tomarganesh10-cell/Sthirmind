import { Module } from '@nestjs/common';
import { HelpController } from './help.controller';
import { HelpService } from './help.service';
import { UsersModule } from '../users/users.module';

@Module({ imports: [UsersModule], controllers: [HelpController], providers: [HelpService], exports: [HelpService] })
export class HelpModule {}
