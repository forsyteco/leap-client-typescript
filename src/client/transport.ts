import { createClient, type Client, type RequestOptions } from "./client";

type HttpMethod = "CONNECT" | "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | "TRACE";
type ParseAs = NonNullable<RequestOptions["parseAs"]>;

export type CreateRequestScopedClientInput = {
  auth: string;
  baseUrl: string;
  apiKey?: string;
  apiKeyHeader?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
};

export type RequestScopedClient = {
  client: Client;
  baseUrl: string;
  auth: string;
  headers: Record<string, string>;
};

export type TransportRequestOptions = {
  method: HttpMethod;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  parseAs?: ParseAs;
  query?: Record<string, unknown>;
  throwOnError?: boolean;
  validateStatus?: (status: number) => boolean;
};

export type TransportFieldsResponse<TData> = {
  data: TData | undefined;
  error?: unknown;
  request: Request;
  response: Response | undefined;
};

export type TransportResponse<TData> = {
  data: TData | undefined;
  headers: Headers | undefined;
  status: number | undefined;
};

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function normalizeToken(token: string): string {
  const trimmed = token.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed;
  }

  return `Bearer ${trimmed}`;
}

export function createRequestScopedClient(input: CreateRequestScopedClientInput): RequestScopedClient {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const auth = normalizeToken(input.auth);
  const apiKeyHeader = input.apiKeyHeader ?? "x-api-key";

  const headers = {
    ...input.headers,
    ...(input.apiKey ? { [apiKeyHeader]: input.apiKey } : {}),
    Authorization: auth,
  };

  const client = createClient({
    auth,
    baseUrl,
    fetch: input.fetch,
    headers,
  });

  return {
    auth,
    baseUrl,
    client,
    headers,
  };
}

export async function requestFields<TData>(
  scoped: RequestScopedClient,
  options: TransportRequestOptions
): Promise<TransportFieldsResponse<TData>> {
  const result = (await scoped.client.request<TData, unknown, false, "fields">({
    body: options.body,
    headers: {
      ...scoped.headers,
      ...options.headers,
    },
    method: options.method,
    parseAs: options.parseAs,
    query: options.query,
    responseStyle: "fields",
    throwOnError: false,
    url: options.url,
  })) as TransportFieldsResponse<TData>;

  const status = result.response?.status;
  if (typeof status === "number" && options.validateStatus && !options.validateStatus(status)) {
    throw new Error(`Request failed with status ${status}.`);
  }

  const shouldThrow = options.throwOnError ?? true;
  if (shouldThrow && result.error !== undefined) {
    throw result.error;
  }

  return result;
}

export async function requestData<TData>(
  scoped: RequestScopedClient,
  options: TransportRequestOptions
): Promise<TData | undefined> {
  const result = await requestFields<TData>(scoped, options);
  return result.data;
}

export async function requestWithResponse<TData>(
  scoped: RequestScopedClient,
  options: TransportRequestOptions
): Promise<TransportResponse<TData>> {
  const result = await requestFields<TData>(scoped, options);
  return {
    data: result.data,
    headers: result.response?.headers,
    status: result.response?.status,
  };
}
