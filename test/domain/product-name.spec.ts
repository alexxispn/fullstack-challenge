import { ProductName } from '../../src/domain/products/value-objects/product-name';
import { InvalidProductNameError } from '../../src/domain/products/errors/invalid-product-name.error';

describe('ProductName', () => {
  it('creates a valid product name', () => {
    expect(ProductName.create('Aurora Ring').value).toBe('Aurora Ring');
  });

  it('rejects empty string', () => {
    expect(() => ProductName.create('')).toThrow(InvalidProductNameError);
  });

  it('rejects whitespace-only string', () => {
    expect(() => ProductName.create('   ')).toThrow(InvalidProductNameError);
  });

  it('trims whitespace', () => {
    expect(ProductName.create('  Aurora Ring  ').value).toBe('Aurora Ring');
  });
});
