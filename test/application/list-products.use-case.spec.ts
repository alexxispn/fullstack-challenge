import { ListProductsUseCase } from '../../src/application/products/use-cases/list-products.use-case';
import { ListProductsCriteria, Product } from '../../src/domain/products/product';
import { ProductReader } from '../../src/ports/product-repository.port';

class ProductsInCatalog implements ProductReader {
  constructor(private products: Product[]) {}

  async findAll(_criteria: ListProductsCriteria): Promise<Product[]> {
    return this.products;
  }
}

const aRing = Product.fromPersistence({
  id: 1,
  name: 'Aurora Ring',
  category: 'rings',
  price: 129,
  isActive: true,
  stock: 25,
  createdAt: '2025-01-11T09:00:00.000Z',
});

const aNecklace = Product.fromPersistence({
  id: 2,
  name: 'Vintage Pearl Pendant',
  category: 'necklaces',
  price: 175,
  isActive: false,
  stock: 0,
  createdAt: '2025-01-15T12:00:00.000Z',
});

describe('ListProductsUseCase', () => {
  it('returns product primitives from the catalog', async () => {
    const useCase = new ListProductsUseCase(new ProductsInCatalog([aRing, aNecklace]));

    const result = await useCase.execute({ activeOnly: false });

    expect(result).toEqual([aRing.toPrimitives(), aNecklace.toPrimitives()]);
  });

  it('returns empty list when catalog is empty', async () => {
    const useCase = new ListProductsUseCase(new ProductsInCatalog([]));

    const result = await useCase.execute({ activeOnly: true });

    expect(result).toEqual([]);
  });
});
