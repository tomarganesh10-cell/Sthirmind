import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { HeartService } from './heart.service';
import { UsersService } from '../users/users.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { CreateRelationshipDto } from './dto/create-relationship.dto';

@ApiTags('Heart')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('heart')
export class HeartController {
  constructor(private heart: HeartService, private users: UsersService) {}

  @Get('journal')
  async getJournal(@CurrentUser() cu: CU, @Query('page') page = '1') {
    const user = await this.users.findByClerkId(cu.id);
    return this.heart.getJournalEntries(user.id, parseInt(page, 10));
  }

  @Post('journal')
  async createJournalEntry(@CurrentUser() cu: CU, @Body() dto: CreateJournalDto) {
    const user = await this.users.findByClerkId(cu.id);
    return this.heart.createJournalEntry(user.id, dto);
  }

  @Get('relationships')
  async getRelationships(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.heart.getRelationships(user.id);
  }

  @Post('relationships')
  async createRelationship(@CurrentUser() cu: CU, @Body() dto: CreateRelationshipDto) {
    const user = await this.users.findByClerkId(cu.id);
    return this.heart.createRelationship(user.id, dto);
  }

  @Post('gratitude')
  async logGratitude(@CurrentUser() cu: CU, @Body() body: { items: string[]; mood?: number }) {
    const user = await this.users.findByClerkId(cu.id);
    return this.heart.logGratitude(user.id, body.items, body.mood);
  }

  @Get('gratitude')
  async getGratitude(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.heart.getGratitudeHistory(user.id);
  }
}
