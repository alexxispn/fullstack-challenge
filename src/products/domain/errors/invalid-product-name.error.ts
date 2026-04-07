import { DomainError } from './domain-error';

export class InvalidProductNameError extends DomainError {
  constructor() {
    super('Invalid product name: must be a non-empty string.');
  }
}
