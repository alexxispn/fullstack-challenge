import { InvalidCategoryError } from '../errors/invalid-category.error';

const VALID_CATEGORIES = ['rings', 'necklaces', 'bracelets', 'earrings'] as const;

export type CategoryValue = (typeof VALID_CATEGORIES)[number];

export class Category {
  private constructor(readonly value: CategoryValue) {}

  static create(value: string): Category {
    const normalized = value.toLowerCase();
    if (!VALID_CATEGORIES.includes(normalized as CategoryValue)) {
      throw new InvalidCategoryError(value);
    }
    return new Category(normalized as CategoryValue);
  }
}
