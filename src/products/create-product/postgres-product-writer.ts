import { Inject, Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';

import { Product } from '../domain/product';
import { ProductWriter } from './product-writer.port';
import { DatabaseService } from '../../shared/database/database.service';

interface ProductRow extends QueryResultRow {
  id: number;
  name: string;
  category: string;
  price: string;
  is_active: boolean;
  stock: number;
  created_at: Date | string;
}

@Injectable()
export class PostgresProductWriter implements ProductWriter {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async create(product: Product): Promise<Product> {
    const primitives = product.toPrimitives();
    const result = await this.databaseService.query<ProductRow>(
      `
        INSERT INTO products (name, category, price, is_active, stock)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, category, price, is_active, stock, created_at
      `,
      [primitives.name, primitives.category, primitives.price, primitives.isActive, primitives.stock],
    );

    return mapRowToProduct(result.rows[0]);
  }
}

function mapRowToProduct(row: ProductRow): Product {
  return Product.fromPersistence({
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    isActive: row.is_active,
    stock: row.stock,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  });
}
