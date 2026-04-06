import { Price } from '../../src/domain/products/value-objects/price';
import { InvalidPriceError } from '../../src/domain/products/errors/invalid-price.error';

describe('Price', () => {
  it('creates a valid price', () => {
    const price = Price.create(129);

    expect(price.value).toBe(129);
  });

  it('accepts zero price', () => {
    expect(Price.create(0).value).toBe(0);
  });

  it('accepts price with 2 decimal places', () => {
    expect(Price.create(89.50).value).toBe(89.50);
  });

  it('rejects negative price', () => {
    expect(() => Price.create(-1)).toThrow(InvalidPriceError);
  });

  it('rejects price with more than 2 decimal places', () => {
    expect(() => Price.create(99.999)).toThrow(InvalidPriceError);
  });
});
