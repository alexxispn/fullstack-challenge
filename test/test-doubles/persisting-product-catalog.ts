import { Product } from '../../src/products/domain/product';
import { ProductWriter } from '../../src/products/create-product/product-writer.port';

export class PersistingProductCatalog implements ProductWriter {
  async create(product: Product): Promise<Product> {
    return Product.fromPersistence({
      ...product.toPrimitives(),
      id: 99,
      createdAt: '2025-02-01T00:00:00.000Z',
    });
  }
}
