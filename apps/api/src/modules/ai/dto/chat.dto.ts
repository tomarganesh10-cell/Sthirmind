import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty() @IsString() message: string;
  @ApiProperty() @IsEnum(['LIFE_COACH','HEALTH_COACH','PURPOSE_COACH','RELATIONSHIP_COACH','MENTAL_WELLNESS','EXECUTIVE_COACH','MEDITATION_COACH','HAPPINESS_COACH','SLEEP_COACH','NUTRITION_COACH','CAREER_COACH','FINANCIAL_COACH','SPIRITUAL_COACH','SOCIAL_COACH','CRISIS_SUPPORT']) agentType: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sessionId?: string;
}
