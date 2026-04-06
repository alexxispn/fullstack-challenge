import { CreateProductUseCase } from '../../src/application/products/use-cases/create-product.use-case';
import { Product } from '../../src/domain/products/product';
import { ProductWriter } from '../../src/ports/product-repository.port';
import { InvalidPriceError } from '../../src/domain/products/errors/invalid-price.error';
import { InvalidStockError } from '../../src/domain/products/errors/invalid-stock.error';

class ProductCatalogSpy implements ProductWriter {
  private lastSaved: Product | null = null;

  async create(product: Product): Promise<Product> {
    this.lastSaved = product;
    return Product.fromPersistence({
      ...product.toPrimitives(),
      id: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    });
  }

  savedProduct(): Product {
    if (!this.lastSaved) throw new Error('No product was saved');
    return this.lastSaved;
  }
}

const validCommand = {
  name: 'Aurora Ring',
  category: 'rings',
  price: 129,
  isActive: true,
  stock: 25,
};

describe('CreateProductUseCase', () => {
  it('saves the product and returns primitives with id', async () => {
    const catalog = new ProductCatalogSpy();
    const useCase = new CreateProductUseCase(catalog);

    const result = await useCase.execute(validCommand);

    expect(result).toEqual(expect.objectContaining({
      id: 1,
      name: 'Aurora Ring',
      category: 'rings',
      price: 129,
      isActive: true,
      stock: 25,
    }));
  });

  it('passes the domain product to the writer', async () => {
    const catalog = new ProductCatalogSpy();
    const useCase = new CreateProductUseCase(catalog);

    await useCase.execute(validCommand);

    const saved = catalog.savedProduct().toPrimitives();
    expect(saved.name).toBe('Aurora Ring');
    expect(saved.category).toBe('rings');
    expect(saved.price).toBe(129);
    expect(saved.stock).toBe(25);
  });

  it('rejects invalid price before reaching the writer', async () => {
    const catalog = new ProductCatalogSpy();
    const useCase = new CreateProductUseCase(catalog);

    await expect(
      useCase.execute({ ...validCommand, price: -1 }),
    ).rejects.toThrow(InvalidPriceError);
  });

  it('rejects invalid stock before reaching the writer', async () => {
    const catalog = new ProductCatalogSpy();
    const useCase = new CreateProductUseCase(catalog);

    await expect(
      useCase.execute({ ...validCommand, stock: -1 }),
    ).rejects.toThrow(InvalidStockError);
  });
});
