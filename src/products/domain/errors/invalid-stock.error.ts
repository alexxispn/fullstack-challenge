import { DomainError } from '../../../shared/domain/errors/domain-error';

export class InvalidStockError extends DomainError {
  constructor(value: number) {
    super(`Invalid stock: ${value}. Stock must be a non-negative integer.`);
  }
}
