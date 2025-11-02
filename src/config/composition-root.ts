import { createAuth0 } from '@auth0/auth0-vue';
import type { ProductDeps } from '../app/product-service';
import { HttpProductService } from '../infra/http-product-service';

export function createProductDeps(): ProductDeps {
  let baseUrl: URL;
  try {
    // Default to the local Functions host when the setting is absent.
    baseUrl = new URL(
      import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7071/api',
    );
  } catch {
    throw new Error('VITE_API_BASE_URL must be an absolute HTTP(S) URL.');
  }

  if (
    (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') ||
    baseUrl.username !== '' ||
    baseUrl.password !== '' ||
    baseUrl.search !== '' ||
    baseUrl.hash !== ''
  ) {
    throw new Error(
      'VITE_API_BASE_URL must be an HTTP(S) URL without credentials, query or fragment.',
    );
  }

  // Append products to the base path even if the setting omits a final slash.
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/`;
  return {
    productService: new HttpProductService({ baseUrl: baseUrl.toString() }),
  };
}

export function createAuth0Plugin() {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN?.trim();
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID?.trim();
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE?.trim();
  if (!domain || !clientId || !audience) {
    throw new Error('Auth0 domain, client ID and API audience are required.');
  }
  return createAuth0({
    domain,
    clientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience,
      scope: 'openid profile email read:products',
    },
  });
}
