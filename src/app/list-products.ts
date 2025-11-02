import type { Product } from '../domain/product';
import type { ProductDeps } from './product-service';

export type ListProductsResult = {
  readonly success: true;
  readonly data: readonly Product[];
};

export async function listProducts(
  deps: ProductDeps,
  accessToken?: string,
): Promise<ListProductsResult> {
  const data = await deps.productService.listProducts(accessToken);
  return { success: true, data };
}
