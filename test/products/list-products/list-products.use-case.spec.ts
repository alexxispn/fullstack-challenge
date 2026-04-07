import { ListProductsUseCase } from '../../../src/products/list-products/list-products.use-case';
import { ProductExamples } from '../../object-mothers/product-examples';
import { ProductsInCatalog } from '../../test-doubles/products-in-catalog';

const aRing = ProductExamples.aRing();
const aNecklace = ProductExamples.aNecklace();

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
