import { Inject, Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';

import { Product } from '../domain/product';
import { ListProductsCriteria } from './list-products-criteria';
import { ProductReader } from './product-reader.port';
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
export class PostgresProductReader implements ProductReader {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async findAll(criteria: ListProductsCriteria): Promise<Product[]> {
    const filters = [
      { applies: criteria.activeOnly, clause: 'is_active = $i', value: true },
      { applies: !!criteria.category, clause: 'LOWER(category) = LOWER($i)', value: criteria.category },
      { applies: criteria.maxPrice !== undefined, clause: 'price <= $i', value: criteria.maxPrice },
    ].filter((f) => f.applies);

    const values = filters.map((f) => f.value);
    const whereStatement =
      filters.length > 0
        ? `WHERE ${filters.map((f, i) => f.clause.replace('$i', `$${i + 1}`)).join(' AND ')}`
        : '';

    const result = await this.databaseService.query<ProductRow>(
      `
        SELECT id, name, category, price, is_active, stock, created_at
        FROM products
        ${whereStatement}
        ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows.map(mapRowToProduct);
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
