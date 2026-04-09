import { DomainError } from '../../../shared/domain/errors/domain-error';

export class InvalidCategoryError extends DomainError {
  constructor(value: string) {
    super(`Invalid category: "${value}". Must be one of: rings, necklaces, bracelets, earrings.`);
  }
}
