import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() cu: CU) {
    return this.users.findOrCreate(cu.id, {
      email: cu.email,
      firstName: cu.firstName ?? undefined,
      lastName: cu.lastName ?? undefined,
      imageUrl: cu.imageUrl,
    });
  }

  @Patch('profile')
  async updateProfile(@CurrentUser() cu: CU, @Body() dto: UpdateProfileDto) {
    const user = await this.users.findByClerkId(cu.id);
    return this.users.updateProfile(user.id, dto);
  }

  @Get('stats')
  async getStats(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.users.getStats(user.id);
  }
}
