import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { CommunityService } from './community.service';
import { UsersService } from '../users/users.service';

@ApiTags('Community')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('community')
export class CommunityController {
  constructor(private community: CommunityService, private users: UsersService) {}

  @Get('feed') async getFeed(@Query('page') page = '1') { return this.community.getFeed(parseInt(page, 10)); }
  @Post('posts') async createPost(@CurrentUser() cu: CU, @Body() body: { content: string; pillar?: string }) { const u = await this.users.findByClerkId(cu.id); return this.community.createPost(u.id, body.content, body.pillar); }
  @Post('posts/:id/like') async likePost(@Param('id') id: string) { return this.community.likePost(id); }
}
