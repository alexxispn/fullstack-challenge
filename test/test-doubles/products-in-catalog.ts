import { ListProductsCriteria, Product } from '../../src/domain/products/product';
import { ProductReader } from '../../src/ports/product-repository.port';

export class ProductsInCatalog implements ProductReader {
  constructor(private products: Product[]) {}

  async findAll(_criteria: ListProductsCriteria): Promise<Product[]> {
    return this.products;
  }
}
