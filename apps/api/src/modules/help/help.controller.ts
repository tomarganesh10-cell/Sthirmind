import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { HelpService } from './help.service';
import { UsersService } from '../users/users.service';

@ApiTags('Help')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('help')
export class HelpController {
  constructor(private help: HelpService, private users: UsersService) {}

  @Get('impact') async getImpact(@CurrentUser() cu: CU) { const u = await this.users.findByClerkId(cu.id); return this.help.getImpactProfile(u.id); }
  @Post('volunteer') async logVolunteer(@CurrentUser() cu: CU, @Body() body: any) { const u = await this.users.findByClerkId(cu.id); return this.help.logVolunteer(u.id, body); }
  @Get('volunteer') async getVolunteer(@CurrentUser() cu: CU) { const u = await this.users.findByClerkId(cu.id); return this.help.getVolunteerHistory(u.id); }
  @Get('challenges') async getChallenges() { return this.help.getChallenges(); }
  @Post('challenges/:id/join') async joinChallenge(@CurrentUser() cu: CU, @Param('id') id: string) { const u = await this.users.findByClerkId(cu.id); return this.help.joinChallenge(u.id, id); }
}
