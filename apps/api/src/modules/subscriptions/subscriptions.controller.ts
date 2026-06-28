import { Body, Controller, Get, Headers, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { UsersService } from '../users/users.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptions: SubscriptionsService, private users: UsersService) {}

  @Get('current')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  async getCurrent(@CurrentUser() cu: CU) {
    const u = await this.users.findByClerkId(cu.id);
    return this.subscriptions.getSubscription(u.id);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  async createCheckout(@CurrentUser() cu: CU, @Body() body: { tier: 'LEADER' | 'EXECUTIVE'; successUrl: string; cancelUrl: string }) {
    const u = await this.users.findByClerkId(cu.id);
    return this.subscriptions.createCheckout(u.id, body.tier, cu.email, body.successUrl, body.cancelUrl);
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    return this.subscriptions.handleWebhook(req.rawBody!, sig);
  }
}
