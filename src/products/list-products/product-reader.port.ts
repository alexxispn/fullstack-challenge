import { ListProductsCriteria, Product } from '../domain/product';

export const PRODUCT_READER = Symbol('PRODUCT_READER');

export interface ProductReader {
  findAll(criteria: ListProductsCriteria): Promise<Product[]>;
}
