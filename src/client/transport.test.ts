import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequestScopedClient, requestData, requestWithResponse } from "./transport";

test("createRequestScopedClient should include Authorization and api key headers", () => {
  const scoped = createRequestScopedClient({
    apiKey: "public-key",
    auth: "token-value",
    baseUrl: "https://uk-api.leap.services/",
  });

  assert.equal(scoped.baseUrl, "https://uk-api.leap.services");
  assert.equal(scoped.auth, "Bearer token-value");
  assert.equal(scoped.headers.Authorization, "Bearer token-value");
  assert.equal(scoped.headers["x-api-key"], "public-key");
});

test("requestData should return parsed payload", async () => {
  let receivedRequest: Request | undefined;
  const scoped = createRequestScopedClient({
    apiKey: "public-key",
    auth: "token-value",
    baseUrl: "https://uk-api.leap.services",
    fetch: async (input, init) => {
      receivedRequest = new Request(input, init);
      return new Response(JSON.stringify({ matterList: [{ matterId: "m-1" }] }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    },
  });

  const response = await requestData<{ matterList: Array<{ matterId: string }> }>(scoped, {
    method: "GET",
    query: { maxItems: "1" },
    url: "/api/v3/matters",
  });

  assert.deepEqual(response, { matterList: [{ matterId: "m-1" }] });
  assert.ok(receivedRequest);
  assert.match(receivedRequest?.url ?? "", /\/api\/v3\/matters\?maxItems=1$/);
});

test("requestWithResponse should include status and data", async () => {
  const scoped = createRequestScopedClient({
    auth: "token-value",
    baseUrl: "https://uk-api.leap.services",
    fetch: async () =>
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
        status: 202,
      }),
  });

  const response = await requestWithResponse<{ ok: boolean }>(scoped, {
    method: "POST",
    url: "/api/v1/documents",
  });

  assert.equal(response.status, 202);
  assert.deepEqual(response.data, { ok: true });
});
