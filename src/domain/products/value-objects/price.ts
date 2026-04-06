import { InvalidPriceError } from '../errors/invalid-price.error';

export class Price {
  private constructor(readonly value: number) {}

  static create(value: number): Price {
    if (value < 0 || !Price.hasAtMostTwoDecimals(value)) {
      throw new InvalidPriceError(value);
    }
    return new Price(value);
  }

  private static hasAtMostTwoDecimals(value: number): boolean {
    return Number.isFinite(value) && Math.round(value * 100) === value * 100;
  }
}
