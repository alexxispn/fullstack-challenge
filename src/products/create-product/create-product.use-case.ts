import { CreateProductCommand, Product, ProductPrimitives } from '../domain/product';
import { ProductWriter } from './product-writer.port';

export class CreateProductUseCase {
  constructor(private readonly productWriter: ProductWriter) {}

  async execute(command: CreateProductCommand): Promise<ProductPrimitives> {
    const product = Product.create(command);
    const saved = await this.productWriter.create(product);
    return saved.toPrimitives();
  }
}
