import { Module } from '@nestjs/common';

import { DatabaseModule } from '../shared/database/database.module';
import { ListProductsController } from './list-products/list-products.controller';
import { ListProductsUseCase } from './list-products/list-products.use-case';
import { PRODUCT_READER } from './list-products/product-reader.port';
import { PostgresProductReader } from './list-products/postgres-product-reader';
import { CreateProductController } from './create-product/create-product.controller';
import { CreateProductUseCase } from './create-product/create-product.use-case';
import { PRODUCT_WRITER } from './create-product/product-writer.port';
import { PostgresProductWriter } from './create-product/postgres-product-writer';

@Module({
  imports: [DatabaseModule],
  controllers: [ListProductsController, CreateProductController],
  providers: [
    PostgresProductReader,
    {
      provide: PRODUCT_READER,
      useExisting: PostgresProductReader,
    },
    {
      provide: ListProductsUseCase,
      useFactory: (reader: PostgresProductReader) =>
        new ListProductsUseCase(reader),
      inject: [PRODUCT_READER],
    },
    PostgresProductWriter,
    {
      provide: PRODUCT_WRITER,
      useExisting: PostgresProductWriter,
    },
    {
      provide: CreateProductUseCase,
      useFactory: (writer: PostgresProductWriter) =>
        new CreateProductUseCase(writer),
      inject: [PRODUCT_WRITER],
    },
  ],
})
export class ProductsModule {}
