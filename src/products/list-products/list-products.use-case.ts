import { ProductPrimitives } from '../domain/product';
import { ListProductsCriteria } from './list-products-criteria';
import { ProductReader } from './product-reader.port';

export class ListProductsUseCase {
  constructor(private readonly productReader: ProductReader) {}

  async execute(criteria: ListProductsCriteria): Promise<ProductPrimitives[]> {
    const products = await this.productReader.findAll(criteria);
    return products.map((product) => product.toPrimitives());
  }
}
