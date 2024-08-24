/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Env {
  readonly GOOGLE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: Env;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
