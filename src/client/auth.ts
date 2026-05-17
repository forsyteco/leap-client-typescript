import { client as leapClient } from "./client.gen";

type ConfigurableClient = {
  setConfig: (config: Record<string, unknown>) => void;
};

type OAuthGrantInput = {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  audience?: string;
};

export type ExchangeAuthorizationCodeInput = OAuthGrantInput & {
  code: string;
  redirectUri: string;
};

export type RefreshTokenInput = OAuthGrantInput & {
  refreshToken: string;
};

export type OAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  [key: string]: unknown;
};

export type ConfigureAuthInput = {
  client: ConfigurableClient;
  baseUrl: string;
  auth: string;
  apiKey?: string;
  apiKeyHeader?: string;
  headers?: Record<string, string>;
};

export type ConfigureAuthResult = {
  baseUrl: string;
  auth: string;
  headers: Record<string, string>;
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

async function postOAuthToken(
  tokenUrl: string,
  body: URLSearchParams
): Promise<OAuthTokenResponse> {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const responseBody = (await response.json().catch(() => undefined)) as OAuthTokenResponse | undefined;
  if (!response.ok) {
    const statusLabel = `${response.status} ${response.statusText}`.trim();
    throw new Error(`OAuth token request failed (${statusLabel}).`);
  }

  return responseBody ?? {};
}

export async function exchangeAuthorizationCode(
  input: ExchangeAuthorizationCodeInput
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
  });

  if (input.scope) body.set("scope", input.scope);
  if (input.audience) body.set("audience", input.audience);

  return postOAuthToken(input.tokenUrl, body);
}

export async function refreshToken(input: RefreshTokenInput): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: input.refreshToken,
    client_id: input.clientId,
    client_secret: input.clientSecret,
  });

  if (input.scope) body.set("scope", input.scope);
  if (input.audience) body.set("audience", input.audience);

  return postOAuthToken(input.tokenUrl, body);
}

export function configureAuth(input: ConfigureAuthInput): ConfigureAuthResult {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const auth = normalizeToken(input.auth);
  const apiKeyHeader = input.apiKeyHeader ?? "x-api-key";

  const headers: Record<string, string> = {
    ...(input.headers ?? {}),
    ...(input.apiKey ? { [apiKeyHeader]: input.apiKey } : {}),
  };

  const config = {
    baseUrl,
    baseURL: baseUrl,
    auth,
    headers,
  };

  input.client.setConfig(config);
  return { baseUrl, auth, headers };
}

export const client = leapClient;
