import type { ProductService } from '../app/product-service';
import type { Product } from '../domain/product';

export type HttpClient = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type HttpProductServiceOptions = {
  readonly baseUrl: string;
  readonly http?: HttpClient;
};

export class HttpProductService implements ProductService {
  private readonly productsUrl: string;
  private readonly http: HttpClient;

  constructor(options: HttpProductServiceOptions) {
    this.productsUrl = new URL('products', options.baseUrl).toString();
    this.http = options.http ?? ((input, init) => fetch(input, init));
  }

  async listProducts(): Promise<readonly Product[]> {
    const headers: Record<string, string> = { Accept: 'application/json' };

    const response = await this.http(this.productsUrl, { headers });
    if (!response.ok) {
      throw new Error(
        `Product API request failed with status ${response.status}`,
      );
    }

    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      throw new Error('Product API returned an invalid list');
    }

    const products = body.map(decodeProduct);
    const ids = new Set(products.map((product) => product.id));
    if (ids.size !== products.length) {
      throw new Error('Product API returned duplicate product IDs');
    }
    return products;
  }
}

function decodeProduct(value: unknown): Product {
  if (!isRecord(value)) {
    throw new Error('Product API returned an invalid product record');
  }

  // These are wire-shape checks for a read-only projection, not editing rules.
  const { id, name, pricePence, description } = value;
  if (
    typeof id !== 'string' ||
    id.trim() === '' ||
    typeof name !== 'string' ||
    name.trim() === '' ||
    (pricePence !== undefined &&
      (typeof pricePence !== 'number' ||
        !Number.isSafeInteger(pricePence) ||
        pricePence < 0)) ||
    (description !== undefined && typeof description !== 'string')
  ) {
    throw new Error('Product API returned invalid product fields');
  }

  return { id, name, pricePence, description };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
