# notro-loader

<p>
<a href="README.md">English</a>
 | 
<a href="./README.ja.md">日本語</a>
</p>

![npm](https://img.shields.io/npm/v/notro-loader)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

Notionデータベースのコンテンツを[Markdown Content API](https://developers.notion.com/)経由で取得し、[Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)に取り込むAstro Content Loaderライブラリです。取得したMarkdownはSätteri（Astro 7のRust製Markdown/MDXプロセッサ）でコンパイルし、Notionの各ブロック種別に対応したコンポーネント一式で描画します。

> [!TIP]
> このパッケージは[mosugi/notro](https://github.com/mosugi/notro)モノレポの一部です。動作するサンプルとして`templates/blog/`のブログテンプレートを参照してください。

## 目次

- [エントリーポイント](#エントリーポイント)
- [インストール](#インストール)
- [セットアップ](#セットアップ)
  1. [`astro.config.mjs`](#1-astroconfigmjs)
  2. [`src/content.config.ts`](#2-srccontentconfigts)
  3. [ページコンポーネント](#3-ページコンポーネント)
- [`NotroContent`が描画するもの](#notrocontentが描画するもの)
- [画像の扱い](#画像の扱い)
- [Markdown前処理（`preprocessNotionMarkdown`）](#markdown前処理preprocessnotionmarkdown)
- [Notion APIの制約](#notion-apiの制約)
- [環境変数](#環境変数)
- [APIリファレンス](#apiリファレンス)

## エントリーポイント

`notro-loader`は、それぞれ利用可能な場所が異なる4つのエントリーポイントを公開しています。

| エントリーポイント | インポート | 用途 |
|---|---|---|
| `notro-loader` | `import { NotroContent, loader, ... } from "notro-loader"` | AstroコンポーネントとContent Loader用。**`astro.config.mjs`では使用できません**（AstroのconfigはJSXレンダラーが登録される前に評価されるため） |
| `notro-loader/utils` | `import { getPlainText, preprocessNotionMarkdown, ... } from "notro-loader/utils"` | Astroコンポーネントへの依存がない純粋なTypeScriptヘルパー。configファイルやNodeスクリプト、画像サービスなどどこでも安全に利用できます |
| `notro-loader/integration` | `import { notro } from "notro-loader/integration"` | `notro()` Astroインテグレーション。`astro.config.mjs`で`@astrojs/mdx`を正しいSätteriプラグインパイプラインと共に登録するために使用します |
| `notro-loader/image-service` | `import { notionImageService } from "notro-loader/image-service"` | Notion S3の署名付きURLから、キャッシュキー計算前に期限切れとなる`X-Amz-*`クエリパラメータを取り除くAstro画像サービス。`astro.config.mjs`の`image.service`で使用します |

## インストール

```sh
npx astro add notro-loader
```

これによりパッケージがインストールされ、`astro.config.mjs`に`notro()`インテグレーションが自動的に追加されます。

手動でインストールする場合は次のようにします。

```sh
npm install notro-loader
```

## セットアップ

### 1. `astro.config.mjs`

`astro add notro-loader`を実行すると自動的に設定されます。手動でインストールした場合は、インテグレーションと（任意で）画像サービスを追加してください。

```js
import { defineConfig } from "astro/config";
import { notro } from "notro-loader/integration";
import { notionImageService } from "notro-loader/image-service";

export default defineConfig({
  image: { service: notionImageService },
  integrations: [notro()],
});
```

`notro()`は、必要なSätteriプラグインパイプラインと、`NotroContent`が実行時に依存する`astro:jsx`レンダラーを備えた状態で`@astrojs/mdx`を登録します。オプションを指定しない場合、色クラス・コンポーネントのリネーム・見出しスラッグ・目次・ページリンク解決といったnotroのコアプラグインのみが適用されます。リッチな機能はオプトインです。

| オプション | 型 | 用途 |
|---|---|---|
| `mdastPlugins` | `MdastPluginInput[]` | notroのコアプラグインの後に実行されるSätteri mdastプラグイン（例：数式描画用のKaTeXプラグイン） |
| `hastPlugins` | `HastPluginInput[]` | リネーム後、見出しスラッグ/目次の前に実行されるSätteri hastプラグイン（例：[`satteri-beautiful-mermaid`](https://github.com/mosugi/notro/tree/main/packages/satteri-beautiful-mermaid)） |
| `features` | `Features` | notroのデフォルト設定にマージされる追加のSätteriパーサー機能（例：`{ math: true }`） |
| `shikiConfig` | `Record<string, unknown>` | Shikiシンタックスハイライトのhastプラグインを、ユーザープラグインの最後に自動的に注入する（`npm install shiki`が必要）。例：`{ theme: 'github-dark' }` |
| `viteExternals` | `string[]` | ViteのSSR外部化リスト（`ssr.external`）に追加するパッケージ（ネイティブバイナリや動的インポートを使うパッケージ向け） |
| `extendMarkdownConfig` | `boolean` | Astroのベースmarkdown設定を拡張するかどうか（デフォルト：`false`） |

remark/rehypeプラグインは**サポートされていません** — Astro 7では`markdown.remarkPlugins` / `rehypePlugins`が非推奨となり、Sätteriはこれらを実行できません。代わりにSätteriのmdast/hastプラグインAPIを使用してください（[ドキュメント](https://satteri.bruits.org/docs/plugins/)）。

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

`loader`関数を使ってコレクションを定義します。`pageWithMarkdownSchema`をデータベースのプロパティで拡張してください。プロパティスキーマは`notroProperties`のショートハンドを使うと簡潔に書けます。

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

`loader(options)`が受け取るオプションは次のとおりです。

| オプション | 型 | 用途 |
|---|---|---|
| `queryParameters` | `QueryDataSourceParameters` | Notion APIの`dataSources.query`にそのまま渡されます |
| `clientOptions` | `ConstructorParameters<typeof Client>[0]` | `@notionhq/client`のコンストラクタに渡されます（例：`{ auth }`） |
| `generateId` | `(page) => string`（任意） | ページごとのカスタムエントリーIDを生成する関数。デフォルトはNotionページのUUID。エントリーIDを特定の形式に合わせる必要がある場合（例：Starlightのサイドバースラグ）に使用します |
| `useFilePath` | `boolean`（任意、デフォルト`false`） | 各ストアエントリーに合成の`filePath`を設定し、Starlightのサイドバー自動生成がルートパスを解決できるようにします。`@astrojs/starlight`を使う場合のみ必要です |

Loaderは`last_edited_time`のダイジェストでページをキャッシュし、削除・編集された、あるいはNotionの署名付きS3 URLが期限切れになったエントリーのみを再取得します。

Astroの[Live Content Collections](https://docs.astro.build/en/guides/content-collections/#live-content-collections)向けのライブリロード版も用意されています。

```typescript
import { liveLoader } from "notro-loader";
```

`loader()`と同じ`queryParameters` / `clientOptions`の形式を受け取ります。

### 3. ページコンポーネント

#### オプションA — ヘッドレス（スタイルなし）

`notro-loader`の`NotroContent`は、クラス指定のないセマンティックなHTMLを描画します。

```astro
---
import { NotroContent, getPlainText } from "notro-loader";

const { entry } = Astro.props;
const title = getPlainText(entry.data.properties.Name);
---

<h1>{title}</h1>
<NotroContent markdown={entry.data.markdown} />
```

#### オプションB — notro-uiを使う

スタイル付きコンポーネントを一度だけインストールします。

```sh
npx notro-ui init
```

その後、コンポーネントマップを`NotroContent`に渡します。

```astro
---
import { NotroContent, getPlainText } from "notro-loader";
import { notroComponents } from "@/components/notro";

const { entry } = Astro.props;
---

<NotroContent markdown={entry.data.markdown} components={notroComponents} />
```

コンポーネントは`src/components/notro/`にコピーされるため、直接編集できます。詳細は[notro-ui](https://github.com/mosugi/notro/tree/main/packages/notro-ui)を参照してください。

`NotroContent`の任意プロパティ：

| プロパティ | 型 | 用途 |
|---|---|---|
| `linkToPages` | `Record<string, { url: string; title: string }>` | Notionのページ内リンクを解決します。`buildLinkToPages()`で構築します |
| `classMap` | `Partial<Record<ClassMapKeys, string>>` | デフォルトコンポーネントを置き換えずにTailwindクラスを注入します |
| `components` | `Partial<NotionComponents>` | コンポーネントの完全な上書き（例：`{ Callout: MyCallout }`） |

## `NotroContent`が描画するもの

`NotroContent`はNotionのMarkdownをHTMLにコンパイルします。各Notionブロック種別はデフォルトでセマンティックなHTML要素にマッピングされます。`components`プロパティで任意の要素を独自のスタイル付きコンポーネントに置き換えられます。

| Notionブロック | デフォルトのHTML | notro-uiコンポーネント |
|---|---|---|
| 段落 | `<p>` | `ColoredParagraph` |
| 見出し1〜4 | `<h1>`〜`<h4>` | `H1`〜`H4` |
| コールアウト | `<aside>` | `Callout` |
| 引用 | `<blockquote>` | `Quote` |
| トグル | `<details>` + `<summary>` | `Toggle` + `ToggleTitle` |
| 区切り線 | `<hr>` | — |
| コード | `<pre>` | — |
| 画像 | `<img>` | `ImageBlock` |
| 動画 | `<figure>` | `Video` |
| 音声 | `<figure>` | `Audio` |
| ファイル | `<div>` | `FileBlock` |
| PDF | `<figure>` | `PdfBlock` |
| テーブル | `<table>` | `TableBlock` |
| 目次 | `<nav>` | `TableOfContents` |
| カラム / カラム内 | `<div>` / `<div>` | `Columns` / `Column` |
| ページリンク | `<a>` | `PageRef` |
| データベースリンク | `<a>` | `DatabaseRef` |
| 空白ブロック | `<div>` | `EmptyBlock` |
| インラインテキスト（色/下線） | `<span>` | `StyledSpan` |
| @メンション | `<span>` | `Mention` |
| 日付メンション | `<time>` | `MentionDate` |

`notro-ui`はオプションのスタイルレイヤーです。詳細は[notro-ui](https://github.com/mosugi/notro/tree/main/packages/notro-ui)を参照してください。

## 画像の扱い

`notro-loader/image-service`はAstroのSharp画像サービスをラップした`notionImageService`をエクスポートします。

Notionは画像を署名付きS3 URLで配信しますが、そのクエリパラメータ（`X-Amz-*`）はおよそ1時間で期限切れになります。Astroは画像のキャッシュキーをURL全体から算出するため、ビルドのたびに新しいURLが発行されると通常はキャッシュミスとなり毎回再最適化が走ってしまいます。`notionImageService`はキャッシュキー計算前に期限切れとなるパラメータを取り除くため、元のファイルが変わらない限り最適化済みの出力がビルド間で再利用されます。

```js
// astro.config.mjs
import { notionImageService } from "notro-loader/image-service";

export default defineConfig({
  image: { service: notionImageService },
});
```

このキャッシュの仕組みを有効にするため、Notionの画像には生の`<img>`タグではなく必ずAstroの`<Image />`コンポーネントを使用してください。

## Markdown前処理（`preprocessNotionMarkdown`）

`preprocessNotionMarkdown()`は、Sätteriの`evaluate()`に渡す前に、Notionが出力する生のMarkdownの構造上の問題を修正します。例えば、直前に空行がない`---`区切り線、レガシーな`:::callout{…}`ディレクティブ構文、CommonMarkが後続の内容を生のHTMLとして飲み込んでしまわないよう閉じタグの後に空行を追加する処理などです。

これは`notro-loader`に組み込まれており、`NotroContent`や`notro()`インテグレーションを使う際は設定不要で自動的に適用されます。カスタムのコンパイルパイプラインで必要な場合に備え、直接エクスポートもされています。

```typescript
import { preprocessNotionMarkdown } from "notro-loader/utils";
```

> [!NOTE]
> 以前のバージョンのnotro-loaderでは、この処理を独立した`remark-notro`パッケージに委譲していました。同パッケージは廃止済みで、`preprocessNotionMarkdown()`は現在`notro-loader`本体に組み込まれており、`notro-loader`と`notro-loader/utils`の両方からエクスポートされています。

## Notion APIの制約

> 参照：[Retrieve a page as Markdown – Notion API](https://developers.notion.com/reference/retrieve-page-markdown)

### コンテンツの切り詰め（`truncated`）

`GET /v1/pages/{page_id}/markdown`は、約**20,000ブロック**を超えるとコンテンツを切り詰めます。

- レスポンスの`truncated: true`で判定できますが、**残りを取得するページネーションAPIはありません**
- notroは`truncated === true`の場合に警告を出し、取得できた内容のままビルドを継続します
- 回避策：巨大なNotionページを複数の小さなページに分割してください

```
⚠ Page abc123: markdown content was truncated by the Notion API (~20,000 block limit).
  No pagination is available for this endpoint.
  Consider splitting this Notion page into smaller pages to avoid truncation.
```

### 描画できないブロック（`unknown_block_ids`）

レスポンスの`unknown_block_ids`には、Notion APIがMarkdownに変換できなかったブロックのID（未対応のブロック種別など）が列挙されます。

- これらのブロックは`markdown`フィールドから**黙って除外**されます
- このエンドポイント経由でその内容を取得する方法はありません
- notroはブロックIDを警告として出力し、ビルドを継続します

```
⚠ Page abc123: 2 block(s) could not be rendered to Markdown by the Notion API and were omitted.
  Block IDs: xxxxxxxx-..., yyyyyyyy-...
```

### APIエラーと自動リトライ

| エラー | 挙動 |
|---|---|
| `429 rate_limited` / `500 internal_server_error` / `503 service_unavailable` | 指数バックオフでリトライ（1秒 / 2秒 / 4秒、最大3回） |
| `401 unauthorized` / `403 restricted_resource` / `404 object_not_found` | リトライなし。警告を出しページをスキップ |
| その他の予期しないエラー | 警告を出しページをスキップ（ビルド自体は継続） |

## 環境変数

| 変数 | 説明 |
|---|---|
| `NOTION_TOKEN` | Notion Internal Integration Token |
| `NOTION_DATASOURCE_ID` | Notionデータソースの ID |

## APIリファレンス

### コンポーネント

| コンポーネント | 説明 |
|---|---|
| `NotroContent` | NotionのMarkdownをHTMLとして描画します。デフォルトではスタイルなし、`components`でカスタマイズ可能 |
| `DatabaseCover` | 最適化されたNotionのカバー画像を描画します |
| `DatabaseProperty` | Notionのプロパティ値をその型に応じて描画します |
| `compileMdxCached` | 低レベルのMDXコンパイルAPI。独自の`NotroContent`を構築する場合に使用します |

### Loader

| エクスポート | 説明 |
|---|---|
| `loader(options)` | Astro Content Loader。オプションは[`src/content.config.ts`](#2-srccontentconfigts)を参照してください |
| `liveLoader(options)` | `loader()`のLive Content Collections版 |
| `pageWithMarkdownSchema` | Loaderが返す基本のZodスキーマ。`pageObjectResponseSchema`に`markdown: z.string()`を追加したもの。`.extend()`でカスタムスキーマを定義できます |

### `notroProperties`

`content.config.ts`でデータベースのプロパティ型を定義するためのZodスキーマのショートハンドです。各キーはNotionのプロパティ型に対応します。

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

個別のスキーマ（例：`titlePropertyPageObjectResponseSchema`）も後方互換性のため引き続きエクスポートされています。

### ユーティリティ

| 関数 | 説明 |
|---|---|
| `getPlainText(property)` | Title、Rich Text、Select、Multi-select、Number、URL、Email、Phone、Date、Unique IDの各プロパティからプレーンテキストを抽出します |
| `getMultiSelect(property)` | multi-selectプロパティのオプション配列を返します。未対応の型や`undefined`の場合は空配列を返すため、型ガードは不要です |
| `hasTag(property, tagName)` | multi-selectプロパティに指定したタグ名が含まれるかを返します。型ガードなしで安全に呼び出せます |
| `buildLinkToPages(entries, options)` | コレクションのエントリーから`linkToPages`マップを構築します。`NotroContent`に渡してページ間リンクを解決するのに使います |
| `colorToCSS(color)` | Notionのカラー名をインラインCSSのスタイル文字列に変換します（カスタムコンポーネントでの利用向け） |
| `preprocessNotionMarkdown(markdown)` | MDXコンパイル前にNotionの生Markdownの構造上の問題を修正します。`NotroContent`と`notro()`が自動的に適用します — 詳細は[Markdown前処理](#markdown前処理preprocessnotionmarkdown)を参照してください |
| `normalizeNotionPresignedUrl(url)` | Notion S3 URLから期限切れとなる`X-Amz-*`クエリパラメータを取り除きます。`notionImageService`が内部的に使用します |
