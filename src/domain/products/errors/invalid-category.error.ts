import { DomainError } from './domain-error';

export class InvalidCategoryError extends DomainError {
  constructor(value: string) {
    super(`Invalid category: "${value}". Must be one of: rings, necklaces, bracelets, earrings.`);
  }
}
