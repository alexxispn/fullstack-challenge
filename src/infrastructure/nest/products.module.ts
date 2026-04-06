import { Module } from '@nestjs/common';

import { CreateProductUseCase } from '../../application/products/use-cases/create-product.use-case';
import { ListProductsUseCase } from '../../application/products/use-cases/list-products.use-case';
import { ProductsController } from '../../adapters/inbound/http/products/products.controller';
import { PostgresProductRepository } from '../../adapters/outbound/persistence/postgres/postgres-product.repository';
import { PRODUCT_READER, PRODUCT_WRITER } from '../../ports/product-repository.port';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController],
  providers: [
    PostgresProductRepository,
    {
      provide: PRODUCT_READER,
      useExisting: PostgresProductRepository,
    },
    {
      provide: PRODUCT_WRITER,
      useExisting: PostgresProductRepository,
    },
    {
      provide: ListProductsUseCase,
      useFactory: (reader: PostgresProductRepository) =>
        new ListProductsUseCase(reader),
      inject: [PRODUCT_READER],
    },
    {
      provide: CreateProductUseCase,
      useFactory: (writer: PostgresProductRepository) =>
        new CreateProductUseCase(writer),
      inject: [PRODUCT_WRITER],
    },
  ],
})
export class ProductsModule {}