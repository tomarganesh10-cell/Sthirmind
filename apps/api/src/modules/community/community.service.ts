import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async getFeed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.communityPost.findMany({
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, imageUrl: true } },
      },
    });
  }

  async createPost(userId: string, content: string, pillar?: string, communityId?: string) {
    const comm = communityId ?? await this.getDefaultCommunityId();
    return this.prisma.communityPost.create({
      data: { userId, content, communityId: comm, pillar: pillar as any },
      include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } },
    });
  }

  async likePost(postId: string) {
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    });
  }

  private async getDefaultCommunityId() {
    let comm = await this.prisma.community.findFirst({ where: { slug: 'general' } });
    if (!comm) {
      comm = await this.prisma.community.create({ data: { name: 'SthirMind Community', slug: 'general' } });
    }
    return comm.id;
  }
}
