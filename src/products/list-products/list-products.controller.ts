import { Controller, Get, Inject, Query } from '@nestjs/common';

import { ProductPrimitives } from '../domain/product';
import { ListProductsUseCase } from './list-products.use-case';
import { ListProductsQueryDto } from './list-products-query.dto';

@Controller('products')
export class ListProductsController {
  constructor(
    @Inject(ListProductsUseCase)
    private readonly listProductsUseCase: ListProductsUseCase,
  ) {}

  @Get()
  listProducts(@Query() query: ListProductsQueryDto): Promise<ProductPrimitives[]> {
    return this.listProductsUseCase.execute({
      activeOnly: query.activeOnly ?? true,
      category: query.category,
      maxPrice: query.maxPrice,
    });
  }
}
