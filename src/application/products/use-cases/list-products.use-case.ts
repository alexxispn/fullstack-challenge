import { ListProductsCriteria, ProductPrimitives } from '../../../domain/products/product';
import { ProductRepositoryPort } from '../../../ports/product-repository.port';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepositoryPort) {}

  async execute(criteria: ListProductsCriteria): Promise<ProductPrimitives[]> {
    const products = await this.productRepository.findAll(criteria);
    return products.map((product) => product.toPrimitives());
  }
}
