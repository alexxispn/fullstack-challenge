import { Product } from '../domain/product';

export const PRODUCT_WRITER = Symbol('PRODUCT_WRITER');

export interface ProductWriter {
  create(product: Product): Promise<Product>;
}
