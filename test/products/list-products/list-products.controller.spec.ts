import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ListProductsController } from '../../../src/products/list-products/list-products.controller';
import { ListProductsQueryDto } from '../../../src/products/list-products/list-products-query.dto';
import { ListProductsUseCase } from '../../../src/products/list-products/list-products.use-case';
import { ProductPrimitives } from '../../../src/products/domain/product';
import { ProductExamples } from '../../object-mothers/product-examples';
import { ProductsInCatalog } from '../../test-doubles/products-in-catalog';

const aRing = ProductExamples.aRing();
const anEarring = ProductExamples.anEarring();

describe('GET /products', () => {
  let testingModule: TestingModule;
  let controller: ListProductsController;
  let queryPipe: ValidationPipe;

  beforeAll(async () => {
    const reader = new ProductsInCatalog([aRing, anEarring]);

    testingModule = await Test.createTestingModule({
      controllers: [ListProductsController],
      providers: [
        {
          provide: ListProductsUseCase,
          useValue: new ListProductsUseCase(reader),
        },
      ],
    }).compile();

    controller = testingModule.get(ListProductsController);
    queryPipe = new ValidationPipe({
      whitelist: true,
      transform: true,
    });
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns products with stock field', async () => {
    const response = await listProducts();

    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, stock: 25 }),
        expect.objectContaining({ id: 3, stock: 50 }),
      ]),
    );
  });

  it('rejects non-numeric maxPrice with 400', async () => {
    await expect(listProducts({ maxPrice: 'abc' })).rejects.toThrow();
  });

  async function listProducts(rawQuery: Record<string, unknown> = {}): Promise<ProductPrimitives[]> {
    const transformedQuery = await queryPipe.transform(rawQuery, {
      type: 'query',
      metatype: ListProductsQueryDto,
      data: '',
    });

    return controller.listProducts(transformedQuery);
  }
});
