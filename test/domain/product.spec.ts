import { Product } from '../../src/domain/products/product';
import { InvalidPriceError } from '../../src/domain/products/errors/invalid-price.error';
import { InvalidStockError } from '../../src/domain/products/errors/invalid-stock.error';
import { InvalidCategoryError } from '../../src/domain/products/errors/invalid-category.error';
import { InvalidProductNameError } from '../../src/domain/products/errors/invalid-product-name.error';

const validCommand = {
  name: 'Aurora Ring',
  category: 'rings',
  price: 129,
  isActive: true,
  stock: 25,
};

describe('Product', () => {
  describe('create', () => {
    it('creates a product with valid inputs', () => {
      const product = Product.create(validCommand);

      expect(product.toPrimitives()).toEqual({
        id: null,
        name: 'Aurora Ring',
        category: 'rings',
        price: 129,
        isActive: true,
        stock: 25,
        createdAt: null,
      });
    });

    it('accepts zero price', () => {
      const product = Product.create({ ...validCommand, price: 0 });

      expect(product.toPrimitives().price).toBe(0);
    });

    it('accepts price with 2 decimal places', () => {
      const product = Product.create({ ...validCommand, price: 89.50 });

      expect(product.toPrimitives().price).toBe(89.50);
    });

    it('rejects negative price', () => {
      expect(() => Product.create({ ...validCommand, price: -1 })).toThrow(InvalidPriceError);
    });

    it('rejects price with more than 2 decimal places', () => {
      expect(() => Product.create({ ...validCommand, price: 99.999 })).toThrow(InvalidPriceError);
    });

    it('accepts zero stock', () => {
      const product = Product.create({ ...validCommand, stock: 0 });

      expect(product.toPrimitives().stock).toBe(0);
    });

    it('rejects negative stock', () => {
      expect(() => Product.create({ ...validCommand, stock: -1 })).toThrow(InvalidStockError);
    });

    it('rejects non-integer stock', () => {
      expect(() => Product.create({ ...validCommand, stock: 2.5 })).toThrow(InvalidStockError);
    });

    it.each(['rings', 'necklaces', 'bracelets', 'earrings'])('accepts valid category: %s', (category) => {
      const product = Product.create({ ...validCommand, category });

      expect(product.toPrimitives().category).toBe(category);
    });

    it('rejects unknown category', () => {
      expect(() => Product.create({ ...validCommand, category: 'watches' })).toThrow(InvalidCategoryError);
    });

    it('normalizes category to lowercase', () => {
      const product = Product.create({ ...validCommand, category: 'RINGS' });

      expect(product.toPrimitives().category).toBe('rings');
    });

    it('rejects empty name', () => {
      expect(() => Product.create({ ...validCommand, name: '' })).toThrow(InvalidProductNameError);
    });

    it('rejects whitespace-only name', () => {
      expect(() => Product.create({ ...validCommand, name: '   ' })).toThrow(InvalidProductNameError);
    });

    it('trims name whitespace', () => {
      const product = Product.create({ ...validCommand, name: '  Aurora Ring  ' });

      expect(product.toPrimitives().name).toBe('Aurora Ring');
    });
  });

  describe('fromPersistence', () => {
    it('reconstitutes a product from primitives', () => {
      const primitives = {
        id: 1,
        name: 'Aurora Ring',
        category: 'rings',
        price: 129,
        isActive: true,
        stock: 25,
        createdAt: '2025-01-11T09:00:00.000Z',
      };

      const product = Product.fromPersistence(primitives);

      expect(product.toPrimitives()).toEqual(primitives);
    });
  });
});
