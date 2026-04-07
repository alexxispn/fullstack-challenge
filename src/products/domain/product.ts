import { ProductName } from './value-objects/product-name';
import { Category } from './value-objects/category';
import { Price } from './value-objects/price';
import { Stock } from './value-objects/stock';

export interface CreateProductCommand {
  name: string;
  category: string;
  price: number;
  isActive: boolean;
  stock: number;
}

export interface ProductPrimitives {
  id: number | null;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
  stock: number;
  createdAt: string | null;
}

export class Product {
  private constructor(
    private readonly id: number | null,
    private readonly name: ProductName,
    private readonly category: Category,
    private readonly price: Price,
    private readonly isActive: boolean,
    private readonly stock: Stock,
    private readonly createdAt: string | null,
  ) {}

  static create(command: CreateProductCommand): Product {
    return new Product(
      null,
      ProductName.create(command.name),
      Category.create(command.category),
      Price.create(command.price),
      command.isActive,
      Stock.create(command.stock),
      null,
    );
  }

  static fromPersistence(primitives: ProductPrimitives): Product {
    return new Product(
      primitives.id,
      ProductName.create(primitives.name),
      Category.create(primitives.category),
      Price.create(primitives.price),
      primitives.isActive,
      Stock.create(primitives.stock),
      primitives.createdAt,
    );
  }

  toPrimitives(): ProductPrimitives {
    return {
      id: this.id,
      name: this.name.value,
      category: this.category.value,
      price: this.price.value,
      isActive: this.isActive,
      stock: this.stock.value,
      createdAt: this.createdAt,
    };
  }
}
