import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransformBoolean } from '../../transforms/transform-boolean';

export class ListProductsQueryDto {
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  activeOnly?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}