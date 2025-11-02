import { inject, ref } from 'vue';
import { listProducts } from '../app/list-products';
import type { Product } from '../domain/product';
import { PRODUCT_DEPS_KEY } from './products-key';

export function useProducts() {
  const deps = inject(PRODUCT_DEPS_KEY);
  if (!deps) throw new Error('Product dependencies were not provided');

  const products = ref<readonly Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProducts = async (_force = false): Promise<void> => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      const result = await listProducts(deps);
      products.value = result.data;
    } catch {
      console.error('Product list request failed.');
      error.value = 'Products could not be loaded. Please try again.';
    } finally {
      loading.value = false;
    }
  };

  return { products, loading, error, fetchProducts };
}
