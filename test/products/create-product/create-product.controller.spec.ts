import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateProductController } from '../../../src/products/create-product/create-product.controller';
import { CreateProductRequestDto } from '../../../src/products/create-product/create-product-request.dto';
import { CreateProductUseCase } from '../../../src/products/create-product/create-product.use-case';
import { ProductPrimitives } from '../../../src/products/domain/product';
import { PersistingProductCatalog } from '../../test-doubles/persisting-product-catalog';

describe('POST /products', () => {
  let testingModule: TestingModule;
  let controller: CreateProductController;
  let bodyPipe: ValidationPipe;

  beforeAll(async () => {
    const writer = new PersistingProductCatalog();

    testingModule = await Test.createTestingModule({
      controllers: [CreateProductController],
      providers: [
        {
          provide: CreateProductUseCase,
          useValue: new CreateProductUseCase(writer),
        },
      ],
    }).compile();

    controller = testingModule.get(CreateProductController);
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

    return controller.createProduct(transformedBody);
  }
});
