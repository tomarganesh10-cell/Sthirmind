import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

const PLANS = {
  LEADER: { price: 4900, priceId: process.env.STRIPE_LEADER_PRICE_ID ?? '' },
  EXECUTIVE: { price: 19900, priceId: process.env.STRIPE_EXECUTIVE_PRICE_ID ?? '' },
};

@Injectable()
export class SubscriptionsService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-04-10' });

  constructor(private prisma: PrismaService) {}

  async getSubscription(userId: string) {
    return this.prisma.subscription.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  async createCheckout(userId: string, tier: 'LEADER' | 'EXECUTIVE', email: string, successUrl: string, cancelUrl: string) {
    const plan = PLANS[tier];
    const session = await this.stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, tier },
    });
    return { checkoutUrl: session.url };
  }

  async handleWebhook(payload: Buffer, sig: string) {
    const event = this.stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '');
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object as any;
      const { userId, tier } = sub.metadata;
      if (userId) {
        await this.prisma.subscription.upsert({
          where: { stripeSubId: sub.id },
          create: { userId, tier, stripeSubId: sub.id, currentPeriodEnd: new Date(sub.current_period_end * 1000), isActive: sub.status === 'active' },
          update: { currentPeriodEnd: new Date(sub.current_period_end * 1000), isActive: sub.status === 'active' },
        });
        await this.prisma.user.update({ where: { id: userId }, data: { tier } });
      }
    }
  }
}
