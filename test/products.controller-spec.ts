import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ProductsController } from '../src/adapters/inbound/http/products/products.controller';
import { ListProductsQueryDto } from '../src/adapters/inbound/http/products/dto/list-products-query.dto';
import { AppModule } from '../src/app.module';
import { ListProductsCriteria, Product } from '../src/domain/products/product';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../src/ports/product-repository.port';

const seededProducts: Product[] = [
  {
    id: 1,
    name: 'Aurora Ring',
    category: 'rings',
    price: 129,
    isActive: true,
    createdAt: '2025-01-11T09:00:00.000Z',
  },
  {
    id: 2,
    name: 'Vintage Pearl Pendant',
    category: 'necklaces',
    price: 175,
    isActive: false,
    createdAt: '2025-01-15T12:00:00.000Z',
  },
  {
    id: 3,
    name: 'Sapphire Hoop Earrings',
    category: 'earrings',
    price: 99,
    isActive: true,
    createdAt: '2025-01-17T11:10:00.000Z',
  },
  {
    id: 4,
    name: 'Mini Charm Bracelet',
    category: 'bracelets',
    price: 72,
    isActive: true,
    createdAt: '2025-01-20T13:05:00.000Z',
  },
];

class FakeProductsRepository implements ProductRepositoryPort {
  async findAll(criteria: ListProductsCriteria): Promise<Product[]> {
    return seededProducts
      .filter((product) => !criteria.activeOnly || product.isActive)
      .filter((product) => !criteria.category || product.category.toLowerCase() === criteria.category.toLowerCase())
      .filter((product) => criteria.maxPrice === undefined || product.price <= criteria.maxPrice)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async create(): Promise<Product> {
    throw new Error('Not implemented in this test double.');
  }
}

describe('GET /products', () => {
  let testingModule: TestingModule;
  let productsController: ProductsController;
  let queryPipe: ValidationPipe;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRODUCT_REPOSITORY_PORT)
      .useValue(new FakeProductsRepository())
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

  it('returns active products by default, newest first', async () => {
    const response = await listProducts();

    expect(response).toEqual([
      expect.objectContaining({ id: 4, isActive: true }),
      expect.objectContaining({ id: 3, isActive: true }),
      expect.objectContaining({ id: 1, isActive: true }),
    ]);
  });

  it('returns inactive products too when activeOnly=false', async () => {
    const response = await listProducts({ activeOnly: 'false' });

    expect(response).toHaveLength(4);
    expect(response.some((product: Product) => product.isActive === false)).toBe(true);
  });

  it('filters by category and maxPrice combined', async () => {
    const response = await listProducts({ category: 'rings', maxPrice: '130' });

    expect(response).toEqual([
      expect.objectContaining({ id: 1, category: 'rings', price: 129 }),
    ]);
  });

  it('returns empty array when no products match filters', async () => {
    const response = await listProducts({ category: 'rings', maxPrice: '10' });

    expect(response).toEqual([]);
  });

  async function listProducts(rawQuery: Record<string, unknown> = {}): Promise<Product[]> {
    const transformedQuery = await queryPipe.transform(rawQuery, {
      type: 'query',
      metatype: ListProductsQueryDto,
      data: '',
    });

    return productsController.listProducts(transformedQuery);
  }
});
