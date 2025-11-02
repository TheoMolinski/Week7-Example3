import type { InjectionKey } from 'vue';
import type { ProductDeps } from '../app/product-service';

export const PRODUCT_DEPS_KEY: InjectionKey<ProductDeps> =
  Symbol('ProductDeps');
