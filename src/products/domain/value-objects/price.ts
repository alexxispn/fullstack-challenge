import { InvalidPriceError } from '../errors/invalid-price.error';

export class Price {
  private constructor(readonly value: number) {}

  static create(value: number): Price {
    if (value < 0 || !Price.hasAtMostTwoDecimals(value)) {
      throw new InvalidPriceError(value);
    }
    return new Price(value);
  }

  private static readonly CENTS_PER_UNIT = 100;

  private static hasAtMostTwoDecimals(value: number): boolean {
    const cents = value * Price.CENTS_PER_UNIT;
    return Number.isFinite(value) && Math.round(cents) === cents;
  }
}
