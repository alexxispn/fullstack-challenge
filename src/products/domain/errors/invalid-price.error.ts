import { DomainError } from '../../../shared/domain/errors/domain-error';

export class InvalidPriceError extends DomainError {
  constructor(value: number) {
    super(`Invalid price: ${value}. Price must be >= 0 with at most 2 decimal places.`);
  }
}
