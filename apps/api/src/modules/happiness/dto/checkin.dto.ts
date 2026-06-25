import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckinDto {
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsNumber() @Min(0) @Max(100) heartScore: number;
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsNumber() @Min(0) @Max(100) hopeScore: number;
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsNumber() @Min(0) @Max(100) healthScore: number;
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsNumber() @Min(0) @Max(100) helpScore: number;
  @ApiPropertyOptional({ minimum: 1, maximum: 7 }) @IsOptional() @IsInt() @Min(1) @Max(7) mood?: number;
  @ApiPropertyOptional({ minimum: 0, maximum: 100 }) @IsOptional() @IsNumber() @Min(0) @Max(100) energyLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() gratitudeItems?: string[];
}
