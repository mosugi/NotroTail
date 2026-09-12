/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  // Notion API credentials (required)
  readonly NOTION_TOKEN: string;
  readonly NOTION_DATASOURCE_ID: string;
  // JSON site settings written by notro-hub's dashboard (optional; see config.ts)
  readonly NOTRO_SITE_CONFIG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
