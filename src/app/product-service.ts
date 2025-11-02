import type { Product } from '../domain/product';

export type ProductDeps = {
  readonly productService: ProductService;
};

export interface ProductService {
  // No ordering promise. Operational failures reject, including invalid records.
  listProducts(): Promise<readonly Product[]>;
}
