import { test } from "node:test";
import assert from "node:assert/strict";
import { configureAuth, exchangeAuthorizationCode, refreshToken } from "./auth";

test("configureAuth should set auth, base URL, and api key header", () => {
  const receivedConfigs: Array<Record<string, unknown>> = [];
  const client = {
    setConfig: (config: Record<string, unknown>) => {
      receivedConfigs.push(config);
    },
  };

  const configured = configureAuth({
    client,
    baseUrl: "https://uk-api.leap.services/",
    auth: "token-value",
    apiKey: "public-api-key",
  });

  assert.equal(receivedConfigs.length, 1);
  assert.deepEqual(receivedConfigs[0], {
    baseUrl: "https://uk-api.leap.services",
    baseURL: "https://uk-api.leap.services",
    auth: "Bearer token-value",
    headers: { "x-api-key": "public-api-key" },
  });
  assert.equal(configured.auth, "Bearer token-value");
});

test("configureAuth should merge custom headers", () => {
  const receivedConfigs: Array<Record<string, unknown>> = [];
  const client = {
    setConfig: (config: Record<string, unknown>) => {
      receivedConfigs.push(config);
    },
  };

  configureAuth({
    client,
    baseUrl: "https://uk-api.leap.services",
    auth: "Bearer token-value",
    headers: { "x-tenant-id": "tenant-1" },
  });

  assert.deepEqual(receivedConfigs[0]?.headers, { "x-tenant-id": "tenant-1" });
});

test("exchangeAuthorizationCode should post form-encoded payload", async () => {
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({ access_token: "new-access", refresh_token: "new-refresh" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = await exchangeAuthorizationCode({
    tokenUrl: "https://auth.example.com/token",
    clientId: "client-id",
    clientSecret: "client-secret",
    code: "auth-code",
    redirectUri: "https://app.example.com/callback",
  });

  assert.equal(response.access_token, "new-access");
  const bodyText = await request?.text();
  assert.match(bodyText ?? "", /grant_type=authorization_code/);
  assert.match(bodyText ?? "", /code=auth-code/);
});

test("refreshToken should post refresh_token payload", async () => {
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({ access_token: "new-access", refresh_token: "new-refresh" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = await refreshToken({
    tokenUrl: "https://auth.example.com/token",
    clientId: "client-id",
    clientSecret: "client-secret",
    refreshToken: "refresh-token",
  });

  assert.equal(response.refresh_token, "new-refresh");
  const bodyText = await request?.text();
  assert.match(bodyText ?? "", /grant_type=refresh_token/);
  assert.match(bodyText ?? "", /refresh_token=refresh-token/);
});
