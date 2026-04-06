import { Category } from '../../src/domain/products/value-objects/category';
import { InvalidCategoryError } from '../../src/domain/products/errors/invalid-category.error';

describe('Category', () => {
  it.each(['rings', 'necklaces', 'bracelets', 'earrings'])('creates valid category: %s', (value) => {
    expect(Category.create(value).value).toBe(value);
  });

  it('rejects unknown category', () => {
    expect(() => Category.create('watches')).toThrow(InvalidCategoryError);
  });

  it('is case-insensitive and normalizes to lowercase', () => {
    expect(Category.create('RINGS').value).toBe('rings');
  });
});
