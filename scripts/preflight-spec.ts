import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { LEAP_SPEC_PATH, LEAP_SPEC_URL } from "../openapi/manifest";

type LeapSpec = {
  swagger?: string;
  openapi?: string;
  paths?: Record<string, unknown>;
};

function assertValidSpecShape(spec: LeapSpec): void {
  const version = spec.swagger ?? spec.openapi;
  if (version !== "2.0") {
    throw new Error(`Expected Swagger/OpenAPI version 2.0, received '${version ?? "unknown"}'.`);
  }

  const pathCount = Object.keys(spec.paths ?? {}).length;
  if (pathCount === 0) {
    throw new Error("Spec did not contain any paths.");
  }
}

async function main() {
  const response = await fetch(LEAP_SPEC_URL, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch LEAP spec: HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("json")) {
    throw new Error(`Expected JSON response content type but received '${contentType || "unknown"}'.`);
  }

  const body = await response.text();
  const parsed = JSON.parse(body) as LeapSpec;
  assertValidSpecShape(parsed);

  const outputPath = resolve(LEAP_SPEC_PATH);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(parsed)}\n`, "utf8");

  const pathCount = Object.keys(parsed.paths ?? {}).length;
  console.log(`preflight: fetched and validated LEAP spec (${pathCount} paths) -> ${LEAP_SPEC_PATH}`);
}

void main();
