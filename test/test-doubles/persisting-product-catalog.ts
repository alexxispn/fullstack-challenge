import { Product } from '../../src/domain/products/product';
import { ProductWriter } from '../../src/ports/product-repository.port';

export class PersistingProductCatalog implements ProductWriter {
  async create(product: Product): Promise<Product> {
    return Product.fromPersistence({
      ...product.toPrimitives(),
      id: 99,
      createdAt: '2025-02-01T00:00:00.000Z',
    });
  }
}