import { InvalidProductNameError } from '../errors/invalid-product-name.error';

export class ProductName {
  private constructor(readonly value: string) {}

  static create(value: string): ProductName {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new InvalidProductNameError();
    }
    return new ProductName(trimmed);
  }
}
