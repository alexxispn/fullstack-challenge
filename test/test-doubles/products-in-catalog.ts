import { Product } from '../../src/products/domain/product';
import { ListProductsCriteria } from '../../src/products/list-products/list-products-criteria';
import { ProductReader } from '../../src/products/list-products/product-reader.port';

export class ProductsInCatalog implements ProductReader {
  constructor(private products: Product[]) {}

  async findAll(_criteria: ListProductsCriteria): Promise<Product[]> {
    return this.products;
  }
}
