import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRelationshipDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() type: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(10) closeness?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
