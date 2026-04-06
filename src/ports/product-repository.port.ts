import { ListProductsCriteria, Product } from '../domain/products/product';

export const PRODUCT_READER = Symbol('PRODUCT_READER');
export const PRODUCT_WRITER = Symbol('PRODUCT_WRITER');

export interface ProductReader {
  findAll(criteria: ListProductsCriteria): Promise<Product[]>;
}

export interface ProductWriter {
  create(product: Product): Promise<Product>;
}

export type ProductRepository = ProductReader & ProductWriter;
