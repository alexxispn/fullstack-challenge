import { ProductPrimitives } from '../../src/products/domain/product';
import { ListProductsCriteria } from '../../src/products/list-products/list-products-criteria';
import { ListProductsUseCase } from '../../src/products/list-products/list-products.use-case';

export class ListProductsCriteriaSpy {
  private receivedCriteria: ListProductsCriteria | null = null;

  constructor(private readonly products: ProductPrimitives[]) {}

  lastReceivedCriteria(): ListProductsCriteria {
    if (!this.receivedCriteria) {
      throw new Error('execute() was not called');
    }
    return this.receivedCriteria;
  }

  asUseCase(): Pick<ListProductsUseCase, 'execute'> {
    return {
      execute: async (criteria: ListProductsCriteria): Promise<ProductPrimitives[]> => {
        this.receivedCriteria = criteria;
        return this.products;
      },
    };
  }
}
