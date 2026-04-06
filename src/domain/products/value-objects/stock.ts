import { InvalidStockError } from '../errors/invalid-stock.error';

export class Stock {
  private constructor(readonly value: number) {}

  static create(value: number): Stock {
    if (value < 0 || !Number.isInteger(value)) {
      throw new InvalidStockError(value);
    }
    return new Stock(value);
  }
}
