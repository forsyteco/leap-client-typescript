import type { UserConfig } from "@hey-api/openapi-ts";
import { LEAP_SPEC_PATH } from "./openapi/manifest";

const config: UserConfig = {
  input: {
    path: LEAP_SPEC_PATH,
  },
  output: {
    format: "prettier",
    path: "src/client",
  },
  plugins: [
    "@hey-api/client-fetch",
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
    },
  ],
};

export default config;
