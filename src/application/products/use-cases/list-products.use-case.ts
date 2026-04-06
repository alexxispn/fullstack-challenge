import { ListProductsCriteria, ProductPrimitives } from '../../../domain/products/product';
import { ProductReader } from '../../../ports/product-repository.port';

export class ListProductsUseCase {
  constructor(private readonly productReader: ProductReader) {}

  async execute(criteria: ListProductsCriteria): Promise<ProductPrimitives[]> {
    const products = await this.productReader.findAll(criteria);
    return products.map((product) => product.toPrimitives());
  }
}