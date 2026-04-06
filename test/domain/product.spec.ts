import { Product } from '../../src/domain/products/product';
import { InvalidPriceError } from '../../src/domain/products/errors/invalid-price.error';
import { InvalidCategoryError } from '../../src/domain/products/errors/invalid-category.error';

describe('Product', () => {
  describe('create', () => {
    it('creates a product with valid inputs', () => {
      const product = Product.create({
        name: 'Aurora Ring',
        category: 'rings',
        price: 129,
        isActive: true,
        stock: 25,
      });

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
    it('rejects invalid price', () => {
      expect(() =>
        Product.create({ name: 'Ring', category: 'rings', price: -1, isActive: true, stock: 0 }),
      ).toThrow(InvalidPriceError);
    });

    it('rejects invalid category', () => {
      expect(() =>
        Product.create({ name: 'Ring', category: 'watches', price: 99, isActive: true, stock: 0 }),
      ).toThrow(InvalidCategoryError);
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
