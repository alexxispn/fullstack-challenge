import { CreateProductUseCase } from '../../../src/products/create-product/create-product.use-case';
import { InvalidPriceError } from '../../../src/products/domain/errors/invalid-price.error';
import { InvalidStockError } from '../../../src/products/domain/errors/invalid-stock.error';
import { CreateProductExamples } from '../../object-mothers/product-examples';
import { ProductCatalogSpy } from '../../test-doubles/product-catalog-spy';

const validCommand = CreateProductExamples.auroraRing();

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
