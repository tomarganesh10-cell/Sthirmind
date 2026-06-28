import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { UsersService } from '../users/users.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService, private users: UsersService) {}

  @Get() async getUnread(@CurrentUser() cu: CU) { const u = await this.users.findByClerkId(cu.id); return this.notifications.getUnread(u.id); }
  @Patch('read-all') async markAllRead(@CurrentUser() cu: CU) { const u = await this.users.findByClerkId(cu.id); return this.notifications.markAllRead(u.id); }
}
