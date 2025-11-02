import { inject, ref, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { listProducts } from '../app/list-products';
import { ProductAccessError } from '../app/product-service';
import type { Product } from '../domain/product';
import { PRODUCT_DEPS_KEY } from './products-key';

export function useProducts() {
  const deps = inject(PRODUCT_DEPS_KEY);
  if (!deps) throw new Error('Product dependencies were not provided');

  const {
    isAuthenticated,
    isLoading,
    user,
    error: authError,
    getAccessTokenSilently,
  } = useAuth0();
  const products = ref<readonly Product[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const retry = ref(0);

  watch(
    [isLoading, isAuthenticated, () => user.value?.sub, retry],
    async (_state, _previous, onCleanup) => {
      // Auth changes, retries and unmounting make the previous request obsolete.
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
        products.value = [];
      });
      products.value = [];
      loading.value = true;
      error.value = null;
      if (isLoading.value) return;
      if (authError.value && !isAuthenticated.value) {
        error.value =
          'Your session could not be restored. Please sign in again.';
        loading.value = false;
        return;
      }
      let failureMessage =
        'An access token could not be obtained. Please sign out and sign in again.';
      try {
        const accessToken = isAuthenticated.value
          ? await getAccessTokenSilently()
          : undefined;
        if (cancelled) return;
        failureMessage = 'Products could not be loaded. Please try again.';
        const result = await listProducts(deps, accessToken);
        if (!cancelled) products.value = result.data;
      } catch (failure) {
        if (cancelled) return;
        error.value =
          failure instanceof ProductAccessError
            ? failure.reason === 'forbidden'
              ? 'You are signed in, but do not have read:products permission. Ask for access, then sign out and sign in again.'
              : 'The API rejected your access token. Please sign out and sign in again.'
            : failureMessage;
      } finally {
        if (!cancelled) loading.value = false;
      }
    },
    { immediate: true, flush: 'sync' },
  );

  const fetchProducts = () => {
    retry.value++;
  };

  return { products, loading, error, fetchProducts };
}
