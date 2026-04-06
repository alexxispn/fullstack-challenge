import { CreateProductCommand, Product, ProductPrimitives } from '../../../domain/products/product';
import { ProductRepositoryPort } from '../../../ports/product-repository.port';

export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepositoryPort) {}

  async execute(command: CreateProductCommand): Promise<ProductPrimitives> {
    const product = Product.create(command);
    const saved = await this.productRepository.create(product);
    return saved.toPrimitives();
  }
}
