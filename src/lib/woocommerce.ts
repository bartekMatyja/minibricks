export interface WooCommerceImage {
  id: number;
  src: string;
  alt?: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  short_description?: string;
  description?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  images?: WooCommerceImage[];
  featured?: boolean;
  status?: string;
}

interface WooCommerceCredentials {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

interface WooCommerceFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

function getWooCommerceCredentials(): WooCommerceCredentials {
  const baseUrl = import.meta.env.VITE_WC_BASE_URL;
  const consumerKey = import.meta.env.VITE_WC_CONSUMER_KEY;
  const consumerSecret = import.meta.env.VITE_WC_CONSUMER_SECRET;

  if (!baseUrl || !consumerKey || !consumerSecret) {
    throw new Error('WooCommerce API environment variables are not configured. Please set VITE_WC_BASE_URL, VITE_WC_CONSUMER_KEY, and VITE_WC_CONSUMER_SECRET.');
  }

  return { baseUrl, consumerKey, consumerSecret };
}

function buildEndpointUrl(endpoint: string, query: Record<string, string> = {}): URL {
  const { baseUrl, consumerKey, consumerSecret } = getWooCommerceCredentials();
  const sanitizedEndpoint = endpoint.replace(/^\//, '');
  const url = new URL(`/wp-json/wc/v3/${sanitizedEndpoint}`, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

  const searchParams = new URLSearchParams(query);
  searchParams.set('consumer_key', consumerKey);
  searchParams.set('consumer_secret', consumerSecret);
  url.search = searchParams.toString();

  return url;
}

export async function wooCommerceFetch<T>(endpoint: string, options: WooCommerceFetchOptions = {}): Promise<T> {
  const url = buildEndpointUrl(endpoint, options.query);
  const fetchOptions: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  };

  if (options.body !== undefined) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };
  }

  const response = await fetch(url.toString(), fetchOptions);
  let parsedBody: any = null;

  try {
    parsedBody = await response.json();
  } catch (error) {
    if (response.ok) {
      return parsedBody as T;
    }

    throw new Error(`WooCommerce request failed with status ${response.status}.`);
  }

  if (!response.ok) {
    const message = parsedBody?.message ?? `WooCommerce request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return parsedBody as T;
}

export async function fetchWooCommerceProducts(query: Record<string, string> = {}): Promise<WooCommerceProduct[]> {
  const defaultQuery: Record<string, string> = {
    per_page: '100',
    status: 'publish',
    ...query,
  };

  return wooCommerceFetch<WooCommerceProduct[]>('products', { query: defaultQuery });
}
