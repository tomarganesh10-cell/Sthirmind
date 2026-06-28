import { Body, Controller, Get, Param, Post, Sse, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { UsersService } from '../users/users.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private ai: AiService, private users: UsersService) {}

  @Post('chat')
  async chat(@CurrentUser() cu: CU, @Body() dto: ChatDto) {
    const user = await this.users.findByClerkId(cu.id);
    return this.ai.chat(user.id, dto.agentType, dto.message, dto.sessionId);
  }

  @Get('sessions')
  async getSessions(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.ai.getSessions(user.id);
  }

  @Get('sessions/:id/messages')
  async getMessages(@Param('id') id: string) {
    return this.ai.getMessages(id);
  }

  @Get('insights')
  async getInsights(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.ai.getInsights(user.id);
  }

  @Post('blueprint')
  async generateBlueprint(@CurrentUser() cu: CU, @Body() body: { type: string }) {
    const user = await this.users.findByClerkId(cu.id);
    return this.ai.generateLifeBlueprint(user.id, body.type);
  }
}
