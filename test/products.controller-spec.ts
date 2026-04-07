import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ProductsController } from '../src/adapters/inbound/http/products/products.controller';
import { CreateProductRequestDto } from '../src/adapters/inbound/http/products/dto/create-product-request.dto';
import { ListProductsQueryDto } from '../src/adapters/inbound/http/products/dto/list-products-query.dto';
import { AppModule } from '../src/app.module';
import { ProductPrimitives } from '../src/domain/products/product';
import { PRODUCT_READER, PRODUCT_WRITER } from '../src/ports/product-repository.port';
import { ProductExamples } from './object-mothers/product-examples';
import { ProductsInCatalog } from './test-doubles/products-in-catalog';
import { PersistingProductCatalog } from './test-doubles/persisting-product-catalog';

const aRing = ProductExamples.aRing();
const anEarring = ProductExamples.anEarring();

describe('GET /products', () => {
  let testingModule: TestingModule;
  let productsController: ProductsController;
  let queryPipe: ValidationPipe;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRODUCT_READER)
      .useValue(new ProductsInCatalog([aRing, anEarring]))
      .overrideProvider(PRODUCT_WRITER)
      .useValue(new PersistingProductCatalog())
      .compile();

    productsController = testingModule.get(ProductsController);
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

    return productsController.listProducts(transformedQuery);
  }
});

describe('POST /products', () => {
  let testingModule: TestingModule;
  let productsController: ProductsController;
  let bodyPipe: ValidationPipe;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRODUCT_READER)
      .useValue(new ProductsInCatalog([]))
      .overrideProvider(PRODUCT_WRITER)
      .useValue(new PersistingProductCatalog())
      .compile();

    productsController = testingModule.get(ProductsController);
    bodyPipe = new ValidationPipe({
      whitelist: true,
      transform: true,
    });
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('rejects negative stock with 400', async () => {
    await expect(
      createProduct({
        name: 'Test Ring',
        category: 'rings',
        price: 99,
        isActive: true,
        stock: -1,
      }),
    ).rejects.toThrow();
  });

  it('creates a product with stock and returns it', async () => {
    const response = await createProduct({
      name: 'Test Ring',
      category: 'rings',
      price: 99,
      isActive: true,
      stock: 42,
    });

    expect(response).toEqual(
      expect.objectContaining({
        name: 'Test Ring',
        category: 'rings',
        price: 99,
        isActive: true,
        stock: 42,
      }),
    );
  });

  async function createProduct(rawBody: Record<string, unknown>): Promise<ProductPrimitives> {
    const transformedBody = await bodyPipe.transform(rawBody, {
      type: 'body',
      metatype: CreateProductRequestDto,
      data: '',
    });

    return productsController.createProduct(transformedBody);
  }
});
