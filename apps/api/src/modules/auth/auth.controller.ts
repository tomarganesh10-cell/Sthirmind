import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('Auth')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private users: UsersService) {}

  @Post('sync')
  async syncUser(@CurrentUser() cu: CU) {
    return this.users.findOrCreate(cu.id, {
      email: cu.email,
      firstName: cu.firstName ?? undefined,
      lastName: cu.lastName ?? undefined,
      imageUrl: cu.imageUrl,
    });
  }
}
