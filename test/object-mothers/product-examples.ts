import { Product, CreateProductCommand } from '../../src/domain/products/product';

export class CreateProductExamples {
  static auroraRing(): CreateProductCommand {
    return {
      name: 'Aurora Ring',
      category: 'rings',
      price: 129,
      isActive: true,
      stock: 25,
    };
  }
}

export class ProductExamples {
  static aRing(): Product {
    return Product.fromPersistence({
      id: 1,
      name: 'Aurora Ring',
      category: 'rings',
      price: 129,
      isActive: true,
      stock: 25,
      createdAt: '2025-01-11T09:00:00.000Z',
    });
  }

  static aNecklace(): Product {
    return Product.fromPersistence({
      id: 2,
      name: 'Vintage Pearl Pendant',
      category: 'necklaces',
      price: 175,
      isActive: false,
      stock: 0,
      createdAt: '2025-01-15T12:00:00.000Z',
    });
  }

  static anEarring(): Product {
    return Product.fromPersistence({
      id: 3,
      name: 'Sapphire Hoop Earrings',
      category: 'earrings',
      price: 99,
      isActive: true,
      stock: 50,
      createdAt: '2025-01-17T11:10:00.000Z',
    });
  }
}
