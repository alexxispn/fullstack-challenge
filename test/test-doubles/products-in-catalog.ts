import { ListProductsCriteria, Product } from '../../src/products/domain/product';
import { ProductReader } from '../../src/products/list-products/product-reader.port';

export class ProductsInCatalog implements ProductReader {
  constructor(private products: Product[]) {}

  async findAll(_criteria: ListProductsCriteria): Promise<Product[]> {
    return this.products;
  }
}
