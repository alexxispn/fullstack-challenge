import { Body, Controller, Inject, Post } from '@nestjs/common';

import { ProductPrimitives } from '../domain/product';
import { CreateProductUseCase } from './create-product.use-case';
import { CreateProductRequestDto } from './create-product-request.dto';

@Controller('products')
export class CreateProductController {
  constructor(
    @Inject(CreateProductUseCase)
    private readonly createProductUseCase: CreateProductUseCase,
  ) {}

  @Post()
  createProduct(@Body() input: CreateProductRequestDto): Promise<ProductPrimitives> {
    return this.createProductUseCase.execute({
      name: input.name,
      category: input.category,
      price: input.price,
      isActive: input.isActive ?? true,
      stock: input.stock,
    });
  }
}
