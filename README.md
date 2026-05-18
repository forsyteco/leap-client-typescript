# LEAP Client TypeScript

TypeScript LEAP API client generated from the LEAP OpenAPI (Swagger 2.0) definition using [Hey API](https://heyapi.dev/openapi-ts/).

This package generates a single combined client at `src/client/` and re-exports it from `src/index.ts`.

## Install

```bash
npm install @forsyteco/leap-client-typescript
```

## Usage (request-scoped)

```ts
import {
  createRequestScopedClient,
  exchangeAuthorizationCode,
  getApiV3Matters,
  requestWithResponse,
  refreshToken,
} from "@forsyteco/leap-client-typescript";

const exchanged = await exchangeAuthorizationCode({
  tokenUrl: process.env.LEAP_TOKEN_URL!,
  clientId: process.env.LEAP_CLIENT_ID!,
  clientSecret: process.env.LEAP_CLIENT_SECRET!,
  code: authCodeFromCallback,
  redirectUri: process.env.LEAP_REDIRECT_URI!,
});

const refreshed = await refreshToken({
  tokenUrl: process.env.LEAP_TOKEN_URL!,
  clientId: process.env.LEAP_CLIENT_ID!,
  clientSecret: process.env.LEAP_CLIENT_SECRET!,
  refreshToken: exchanged.refresh_token!,
});

const scoped = createRequestScopedClient({
  baseUrl: process.env.LEAP_BASE_URL!,
  auth: refreshed.access_token!,
  apiKey: process.env.LEAP_PUBLIC_API_KEY!,
});

const response = await getApiV3Matters({
  client: scoped.client,
  headers: scoped.headers,
  query: { maxItems: "20", isCurrent: "true" },
  throwOnError: true,
});

const uploadResponse = await requestWithResponse(scoped, {
  method: "POST",
  url: "/api/v1/documents",
  body: { matterId: "matter-1", docName: "example.pdf" },
});

console.log(uploadResponse.status, uploadResponse.data);
```

Use `createRequestScopedClient()` per request to avoid request-path reliance on shared mutable singleton auth/baseUrl configuration.

## Development

```bash
npm install
npm run generate
npm run lint
npm run build
```

## Regenerate Client

```bash
npm run generate
```

The generation flow:

1. Downloads and validates the UK LEAP Swagger 2.0 spec from `LEAP_SPEC_URL` (`openapi/manifest.ts`) into `openapi/openapi.json`.
2. Runs Hey API once to produce the combined client at `src/client/`.

Generated clients are treated as build artifacts. Re-run generation whenever LEAP updates the published Swagger definition.

## Publish Checklist

```bash
npm run generate
npm run pack:check
npm run publish:public
```

`prepack` runs automatically during pack/publish, so lint/build happen before publishing without committing `dist`.

## Release Commands

```bash
# choose one semantic version bump
npm run release:patch
npm run release:minor
npm run release:major
```

## CI Publish (npm token)

Set `NPM_TOKEN` in your CI secret store, then run:

```bash
npm ci
npm run generate
npm run lint
npm run build
npm run pack:check
npm run publish:public
```
