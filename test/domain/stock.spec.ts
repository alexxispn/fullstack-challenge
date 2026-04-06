import { Stock } from '../../src/domain/products/value-objects/stock';
import { InvalidStockError } from '../../src/domain/products/errors/invalid-stock.error';

describe('Stock', () => {
  it('creates a valid stock', () => {
    expect(Stock.create(25).value).toBe(25);
  });

  it('accepts zero stock', () => {
    expect(Stock.create(0).value).toBe(0);
  });

  it('rejects negative stock', () => {
    expect(() => Stock.create(-1)).toThrow(InvalidStockError);
  });

  it('rejects non-integer stock', () => {
    expect(() => Stock.create(2.5)).toThrow(InvalidStockError);
  });
});
