# notro-loader

<p>
<a href="README.md">English</a>
 | 
<a href="./README.ja.md">日本語</a>
</p>

![npm](https://img.shields.io/npm/v/notro-loader)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

An Astro Content Loader library that fetches Notion database content via the [Markdown Content API](https://developers.notion.com/) into [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/), compiles it with Sätteri (Astro 7's Rust-based Markdown/MDX processor), and renders it with a full set of Notion block components.

> [!TIP]
> This package is part of the [mosugi/notro](https://github.com/mosugi/notro) monorepo. See the blog template at `templates/blog/` for a full working example.

## Table of contents

- [Entry points](#entry-points)
- [Installation](#installation)
- [Setup](#setup)
  1. [`astro.config.mjs`](#1-astroconfigmjs)
  2. [`src/content.config.ts`](#2-srccontentconfigts)
  3. [Page component](#3-page-component)
- [What `NotroContent` renders](#what-notrocontent-renders)
- [Image handling](#image-handling)
- [Markdown preprocessing (`preprocessNotionMarkdown`)](#markdown-preprocessing-preprocessnotionmarkdown)
- [Notion API limitations](#notion-api-limitations)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)

## Entry points

`notro-loader` exposes four entry points, each scoped to where it's safe to import:

| Entry point | Import | Use case |
|---|---|---|
| `notro-loader` | `import { NotroContent, loader, ... } from "notro-loader"` | Astro components and the Content Loader. **Cannot** be used in `astro.config.mjs` — Astro config is evaluated before the JSX renderer is registered. |
| `notro-loader/utils` | `import { getPlainText, preprocessNotionMarkdown, ... } from "notro-loader/utils"` | Pure TypeScript helpers with no Astro component imports. Safe anywhere: config files, Node scripts, image services. |
| `notro-loader/integration` | `import { notro } from "notro-loader/integration"` | The `notro()` Astro integration. Used in `astro.config.mjs` to register `@astrojs/mdx` with the correct Sätteri plugin pipeline. |
| `notro-loader/image-service` | `import { notionImageService } from "notro-loader/image-service"` | Astro image service that strips expiring `X-Amz-*` query params from Notion S3 URLs before the cache key is computed. Used in `astro.config.mjs` under `image.service`. |

## Installation

```sh
npx astro add notro-loader
```

This installs the package and automatically adds the `notro()` integration to `astro.config.mjs`.

Alternatively, install manually:

```sh
npm install notro-loader
```

## Setup

### 1. `astro.config.mjs`

`astro add notro-loader` configures this automatically. If you installed manually, add the integration and (optionally) the image service:

```js
import { defineConfig } from "astro/config";
import { notro } from "notro-loader/integration";
import { notionImageService } from "notro-loader/image-service";

export default defineConfig({
  image: { service: notionImageService },
  integrations: [notro()],
});
```

`notro()` registers `@astrojs/mdx` with the required Sätteri plugin pipeline and the `astro:jsx` renderer that `NotroContent` depends on at runtime. With no options, it applies only its core Notion plugins (color classes, component renames, heading slugs, table of contents, page-link resolution). Rich features are opt-in:

| Option | Type | Purpose |
|---|---|---|
| `mdastPlugins` | `MdastPluginInput[]` | Sätteri mdast plugins run after notro's core plugins (e.g. a KaTeX plugin for math) |
| `hastPlugins` | `HastPluginInput[]` | Sätteri hast plugins run after renames, before slugs/TOC (e.g. [`satteri-beautiful-mermaid`](https://github.com/mosugi/notro/tree/main/packages/satteri-beautiful-mermaid)) |
| `features` | `Features` | Extra Sätteri parser features merged over notro's defaults (e.g. `{ math: true }`) |
| `shikiConfig` | `Record<string, unknown>` | Injects a Shiki hast plugin as the last user plugin (requires `npm install shiki`). Example: `{ theme: 'github-dark' }` |
| `viteExternals` | `string[]` | Packages to add to Vite's `ssr.external` (for native binaries or dynamic imports) |
| `extendMarkdownConfig` | `boolean` | Whether to extend Astro's base markdown config (default: `false`) |

remark/rehype plugins are **not** supported — Astro 7 deprecated `markdown.remarkPlugins` / `rehypePlugins` and Sätteri cannot run them. Use Sätteri's mdast/hast plugin API instead ([docs](https://satteri.bruits.org/docs/plugins/)).

```js
import { defineConfig } from "astro/config";
import { notro } from "notro-loader/integration";
import { satteriMermaid } from "satteri-beautiful-mermaid";

export default defineConfig({
  integrations: [
    notro({
      shikiConfig: { theme: "github-dark" },
      features: { math: true },
      hastPlugins: [satteriMermaid({ theme: "github-dark" })],
    }),
  ],
});
```

### 2. `src/content.config.ts`

Define your collection using the `loader` function. Extend `pageWithMarkdownSchema` with your database properties. Use the `notroProperties` shorthand for concise property schemas.

```typescript
import { defineCollection } from "astro:content";
import { loader, pageWithMarkdownSchema, notroProperties } from "notro-loader";
import { z } from "zod";

const posts = defineCollection({
  loader: loader({
    queryParameters: {
      data_source_id: import.meta.env.NOTION_DATASOURCE_ID,
      filter: {
        property: "Public",
        checkbox: { equals: true },
      },
    },
    clientOptions: {
      auth: import.meta.env.NOTION_TOKEN,
    },
  }),
  schema: pageWithMarkdownSchema.extend({
    properties: z.object({
      Name: notroProperties.title,
      Description: notroProperties.richText,
      Public: notroProperties.checkbox,
      Tags: notroProperties.multiSelect,
      Date: notroProperties.date,
    }),
  }),
});

export const collections = { posts };
```

`loader(options)` accepts:

| Option | Type | Purpose |
|---|---|---|
| `queryParameters` | `QueryDataSourceParameters` | Passed directly to the Notion API's `dataSources.query` |
| `clientOptions` | `ConstructorParameters<typeof Client>[0]` | Passed to the `@notionhq/client` constructor (e.g. `{ auth }`) |
| `generateId` | `(page) => string` (optional) | Custom entry ID per page. Defaults to the Notion page UUID. Use when the entry ID must match a specific format (e.g. Starlight sidebar slugs) |
| `useFilePath` | `boolean` (optional, default `false`) | Sets a synthetic `filePath` on each store entry so Starlight's sidebar autogenerate can resolve route paths. Only needed with `@astrojs/starlight` |

The loader caches pages by `last_edited_time` digest and re-fetches entries that are deleted, edited, or contain expired Notion pre-signed S3 URLs.

A live-reload variant is also available for Astro's [Live Content Collections](https://docs.astro.build/en/guides/content-collections/#live-content-collections):

```typescript
import { liveLoader } from "notro-loader";
```

It takes the same `queryParameters` / `clientOptions` shape as `loader()`.

### 3. Page component

#### Option A — Headless (no styling)

`NotroContent` from `notro-loader` renders semantic HTML with no classes.

```astro
---
import { NotroContent, getPlainText } from "notro-loader";

const { entry } = Astro.props;
const title = getPlainText(entry.data.properties.Name);
---

<h1>{title}</h1>
<NotroContent markdown={entry.data.markdown} />
```

#### Option B — With notro-ui

Install the styled components once:

```sh
npx notro-ui init
```

Then pass the component map to `NotroContent`:

```astro
---
import { NotroContent, getPlainText } from "notro-loader";
import { notroComponents } from "@/components/notro";

const { entry } = Astro.props;
---

<NotroContent markdown={entry.data.markdown} components={notroComponents} />
```

Components are copied into `src/components/notro/` so you can edit them directly. See [notro-ui](https://github.com/mosugi/notro/tree/main/packages/notro-ui) for details.

Optional `NotroContent` props:

| Prop | Type | Purpose |
|---|---|---|
| `linkToPages` | `Record<string, { url: string; title: string }>` | Resolves internal Notion page links. Build it with `buildLinkToPages()` |
| `classMap` | `Partial<Record<ClassMapKeys, string>>` | Injects Tailwind classes into default components without replacing them |
| `components` | `Partial<NotionComponents>` | Full component overrides (e.g. `{ Callout: MyCallout }`) |

## What `NotroContent` renders

`NotroContent` compiles Notion markdown into HTML. Each Notion block type maps to a semantic HTML element by default. You can replace any element with your own styled component via the `components` prop.

| Notion block | Default HTML | notro-ui component |
|---|---|---|
| Paragraph | `<p>` | `ColoredParagraph` |
| Heading 1–4 | `<h1>`–`<h4>` | `H1`–`H4` |
| Callout | `<aside>` | `Callout` |
| Quote | `<blockquote>` | `Quote` |
| Toggle | `<details>` + `<summary>` | `Toggle` + `ToggleTitle` |
| Divider | `<hr>` | — |
| Code | `<pre>` | — |
| Image | `<img>` | `ImageBlock` |
| Video | `<figure>` | `Video` |
| Audio | `<figure>` | `Audio` |
| File | `<div>` | `FileBlock` |
| PDF | `<figure>` | `PdfBlock` |
| Table | `<table>` | `TableBlock` |
| Table of contents | `<nav>` | `TableOfContents` |
| Columns / Column | `<div>` / `<div>` | `Columns` / `Column` |
| Page link | `<a>` | `PageRef` |
| Database link | `<a>` | `DatabaseRef` |
| Empty block | `<div>` | `EmptyBlock` |
| Inline text (colored/underline) | `<span>` | `StyledSpan` |
| @mention | `<span>` | `Mention` |
| Date mention | `<time>` | `MentionDate` |

`notro-ui` is an optional style layer. See [notro-ui](https://github.com/mosugi/notro/tree/main/packages/notro-ui) for details.

## Image handling

`notro-loader/image-service` exports `notionImageService`, an Astro image service that wraps Astro's Sharp service.

Notion serves images from pre-signed S3 URLs whose query parameters (`X-Amz-*`) expire after roughly an hour. Astro derives its image cache key from the full URL, so a fresh URL on every build normally forces re-optimization every time. `notionImageService` strips the expiring parameters before the cache key is computed, so the optimized output is reused across builds as long as the underlying file hasn't changed.

```js
// astro.config.mjs
import { notionImageService } from "notro-loader/image-service";

export default defineConfig({
  image: { service: notionImageService },
});
```

Always use Astro's `<Image />` component for Notion images rather than a raw `<img>` tag, so this caching behavior takes effect.

## Markdown preprocessing (`preprocessNotionMarkdown`)

`preprocessNotionMarkdown()` fixes structural issues in Notion's raw Markdown output before it's handed to Sätteri's `evaluate()` — things like `---` dividers without a preceding blank line, legacy `:::callout{…}` directive syntax, and closing tags that need a trailing blank line so CommonMark doesn't swallow the following content as raw HTML.

It's built into `notro-loader` and is applied automatically whenever you use `NotroContent` or the `notro()` integration — no setup required. It's also exported directly, in case you need it in a custom compile pipeline:

```typescript
import { preprocessNotionMarkdown } from "notro-loader/utils";
```

> [!NOTE]
> Earlier versions of notro-loader delegated this step to a separate `remark-notro` package. That package has been discontinued — `preprocessNotionMarkdown()` now lives in `notro-loader` itself, exported from both `notro-loader` and `notro-loader/utils`.

## Notion API limitations

> Reference: [Retrieve a page as Markdown – Notion API](https://developers.notion.com/reference/retrieve-page-markdown)

### Content truncation (`truncated`)

`GET /v1/pages/{page_id}/markdown` truncates content at approximately **20,000 blocks**.

- Detectable via `truncated: true` in the response, but **there is no pagination API to fetch the rest**
- notro logs a warning when `truncated === true` and continues the build with the available content
- Workaround: split large Notion pages into multiple smaller pages

```
⚠ Page abc123: markdown content was truncated by the Notion API (~20,000 block limit).
  No pagination is available for this endpoint.
  Consider splitting this Notion page into smaller pages to avoid truncation.
```

### Unrenderable blocks (`unknown_block_ids`)

`unknown_block_ids` in the response lists block IDs that the Notion API could not convert to Markdown (unsupported block types, etc.).

- These blocks are **silently omitted** from the `markdown` field
- There is no way to retrieve their content via this endpoint
- notro logs the block IDs as a warning and continues the build

```
⚠ Page abc123: 2 block(s) could not be rendered to Markdown by the Notion API and were omitted.
  Block IDs: xxxxxxxx-..., yyyyyyyy-...
```

### API errors and automatic retries

| Error | Handling |
|---|---|
| `429 rate_limited` / `500 internal_server_error` / `503 service_unavailable` | Retry with exponential backoff (1s / 2s / 4s, up to 3 times) |
| `401 unauthorized` / `403 restricted_resource` / `404 object_not_found` | No retry. Logs a warning and skips the page |
| Other unexpected errors | Logs a warning and skips the page (build continues) |

## Environment variables

| Variable | Description |
|---|---|
| `NOTION_TOKEN` | Notion Internal Integration Token |
| `NOTION_DATASOURCE_ID` | Notion data source ID |

## API reference

### Components

| Component | Description |
|---|---|
| `NotroContent` | Renders Notion Markdown to HTML. Unstyled by default; pass `components` to customize |
| `DatabaseCover` | Renders a Notion cover image with optimization |
| `DatabaseProperty` | Renders a Notion property value by type |
| `compileMdxCached` | Low-level MDX compile API. Use when building a custom `NotroContent` |

### Loader

| Export | Description |
|---|---|
| `loader(options)` | Astro Content Loader. See [`src/content.config.ts`](#2-srccontentconfigts) for options |
| `liveLoader(options)` | Live Content Collections variant of `loader()` |
| `pageWithMarkdownSchema` | Base Zod schema returned by the loader. Extends `pageObjectResponseSchema` with `markdown: z.string()`. Extend with `.extend()` for custom schemas |

### `notroProperties`

Zod schema shorthands for defining property schemas in `content.config.ts`. Each key maps to a Notion property type.

```typescript
import { notroProperties } from "notro-loader";

// notroProperties.title       → titlePropertyPageObjectResponseSchema
// notroProperties.richText    → richTextPropertyPageObjectResponseSchema
// notroProperties.checkbox    → checkboxPropertyPageObjectResponseSchema
// notroProperties.multiSelect → multiSelectPropertyPageObjectResponseSchema
// notroProperties.select      → selectPropertyPageObjectResponseSchema
// notroProperties.date        → datePropertyPageObjectResponseSchema
// notroProperties.number      → numberPropertyPageObjectResponseSchema
// notroProperties.url         → urlPropertyPageObjectResponseSchema
// notroProperties.email       → emailPropertyPageObjectResponseSchema
// notroProperties.phoneNumber → phoneNumberPropertyPageObjectResponseSchema
// notroProperties.files       → filesPropertyPageObjectResponseSchema
// notroProperties.people      → peoplePropertyPageObjectResponseSchema
// notroProperties.relation    → relationPropertyPageObjectResponseSchema
// notroProperties.rollup      → rollupPropertyPageObjectResponseSchema
// notroProperties.formula     → formulaPropertyPageObjectResponseSchema
// notroProperties.uniqueId    → uniqueIdPropertyPageObjectResponseSchema
// notroProperties.status      → statusPropertyPageObjectResponseSchema
// notroProperties.createdTime → createdTimePropertyPageObjectResponseSchema
// notroProperties.createdBy   → createdByPropertyPageObjectResponseSchema
// notroProperties.lastEditedTime → lastEditedTimePropertyPageObjectResponseSchema
// notroProperties.lastEditedBy   → lastEditedByPropertyPageObjectResponseSchema
// notroProperties.button      → buttonPropertyPageObjectResponseSchema
// notroProperties.verification → verificationPropertyPageObjectResponseSchema
```

Individual schemas (e.g. `titlePropertyPageObjectResponseSchema`) remain exported for backwards compatibility.

### Utilities

| Function | Description |
|---|---|
| `getPlainText(property)` | Extracts plain text from Title, Rich Text, Select, Multi-select, Number, URL, Email, Phone, Date, and Unique ID properties |
| `getMultiSelect(property)` | Returns the options array for a multi-select property. Returns an empty array for unsupported types or `undefined` — no type guard needed |
| `hasTag(property, tagName)` | Returns whether a multi-select property contains the given tag name. Safe to call without a type guard |
| `buildLinkToPages(entries, options)` | Builds a `linkToPages` map from collection entries. Pass to `NotroContent` for resolving inter-page Notion links |
| `colorToCSS(color)` | Converts a Notion color name to an inline CSS style string (for use in custom components) |
| `preprocessNotionMarkdown(markdown)` | Fixes structural issues in Notion's raw Markdown before MDX compilation. Applied automatically by `NotroContent` and `notro()` — see [Markdown preprocessing](#markdown-preprocessing-preprocessnotionmarkdown) |
| `normalizeNotionPresignedUrl(url)` | Strips expiring `X-Amz-*` query params from a Notion S3 URL. Used internally by `notionImageService` |
