import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ListProductsController } from '../../../src/products/list-products/list-products.controller';
import { ListProductsQueryDto } from '../../../src/products/list-products/list-products-query.dto';
import { ListProductsUseCase } from '../../../src/products/list-products/list-products.use-case';
import { ProductPrimitives } from '../../../src/products/domain/product';
import { ProductExamples } from '../../object-mothers/product-examples';
import { ListProductsCriteriaSpy } from '../../test-doubles/list-products-criteria-spy';

const aRing = ProductExamples.aRing().toPrimitives();
const anEarring = ProductExamples.anEarring().toPrimitives();

describe('GET /products', () => {
  let testingModule: TestingModule;
  let controller: ListProductsController;
  let criteriaSpy: ListProductsCriteriaSpy;
  let queryPipe: ValidationPipe;

  beforeAll(async () => {
    criteriaSpy = new ListProductsCriteriaSpy([aRing, anEarring]);

    testingModule = await Test.createTestingModule({
      controllers: [ListProductsController],
      providers: [
        {
          provide: ListProductsUseCase,
          useValue: criteriaSpy.asUseCase(),
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

  it('defaults to active-only products', async () => {
    await listProducts();

    expect(criteriaSpy.lastReceivedCriteria()).toEqual({
      activeOnly: true,
      category: undefined,
      maxPrice: undefined,
    });
  });

  it('passes category filter to use case', async () => {
    await listProducts({ category: 'rings' });

    expect(criteriaSpy.lastReceivedCriteria()).toEqual(
      expect.objectContaining({ category: 'rings' }),
    );
  });

  it('passes maxPrice filter to use case as number', async () => {
    await listProducts({ maxPrice: '150' });

    expect(criteriaSpy.lastReceivedCriteria()).toEqual(
      expect.objectContaining({ maxPrice: 150 }),
    );
  });

  it('passes combined filters to use case', async () => {
    await listProducts({ category: 'rings', maxPrice: '100', activeOnly: 'false' });

    expect(criteriaSpy.lastReceivedCriteria()).toEqual({
      activeOnly: false,
      category: 'rings',
      maxPrice: 100,
    });
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
