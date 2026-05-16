# LEAP Client TypeScript

TypeScript LEAP API client generated from the LEAP OpenAPI (Swagger 2.0) definition using [Hey API](https://heyapi.dev/openapi-ts/).

This package generates a single combined client at `src/client/` and re-exports it from `src/index.ts`.

## Install

```bash
npm install @forsyteco/leap-client-typescript
```

## Usage

```ts
import { client, getApiV1MattersByMatterid } from "@forsyteco/leap-client-typescript";

client.setConfig({
  baseUrl: "https://uk-api.leap.services",
  headers: {
    "x-api-key": process.env.LEAP_PUBLIC_API_KEY!,
    Authorization: `Bearer ${process.env.LEAP_ACCESS_TOKEN!}`,
  },
});

const response = await getApiV1MattersByMatterid({
  client,
  path: { matterid: "..." },
  throwOnError: true,
});
```

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
