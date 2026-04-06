import { CreateProductCommand, Product, ProductPrimitives } from '../../../domain/products/product';
import { ProductWriter } from '../../../ports/product-repository.port';

export class CreateProductUseCase {
  constructor(private readonly productWriter: ProductWriter) {}

  async execute(command: CreateProductCommand): Promise<ProductPrimitives> {
    const product = Product.create(command);
    const saved = await this.productWriter.create(product);
    return saved.toPrimitives();
  }
}
