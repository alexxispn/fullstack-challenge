import { Product } from '../../src/domain/products/product';
import { ProductWriter } from '../../src/ports/product-repository.port';

export class ProductCatalogSpy implements ProductWriter {
  private lastSaved: Product | null = null;

  async create(product: Product): Promise<Product> {
    this.lastSaved = product;
    return Product.fromPersistence({
      ...product.toPrimitives(),
      id: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    });
  }

  savedProduct(): Product {
    if (!this.lastSaved) throw new Error('No product was saved');
    return this.lastSaved;
  }
}