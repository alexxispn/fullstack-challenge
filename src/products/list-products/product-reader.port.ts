import { Product } from '../domain/product';
import { ListProductsCriteria } from './list-products-criteria';

export const PRODUCT_READER = Symbol('PRODUCT_READER');

export interface ProductReader {
  findAll(criteria: ListProductsCriteria): Promise<Product[]>;
}
