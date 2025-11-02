import type { Product } from '../domain/product';

export type ProductDeps = {
  readonly productService: ProductService;
};

export class ProductAccessError extends Error {
  constructor(readonly reason: 'unauthenticated' | 'forbidden') {
    super(`Product access ${reason}`);
    this.name = 'ProductAccessError';
  }
}

export interface ProductService {
  // No ordering promise. Operational failures reject, including invalid records.
  listProducts(accessToken?: string): Promise<readonly Product[]>;
}
