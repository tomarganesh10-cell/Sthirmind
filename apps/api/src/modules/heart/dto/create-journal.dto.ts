import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJournalDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(7) mood?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() pillars?: string[];
  @ApiPropertyOptional() @IsOptional() isPrivate?: boolean;
}
