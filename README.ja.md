# NotroTail

<p>
<a href="README.ja.md">English</a>
 | 
<a href="./README.ja.md">日本語</a>
<!-- |
<a href="./README.zh.md">中文</a>
 |
<a href="./README.ko.md">한국어</a>-->
</p>

![NotroTail.webp](docs%2Fpublic%2FNotroTail.webp)

<p align="center">
<a href="https://notrotail.mosugi.com">WebSite</a>
 | 
<a href="https://notrotail.mosugi.com/doc">Documentation</a>
 | 
<a href="https://notro.mosugi.com">Quick Start</a>
</p>

> [!NOTE]
> NotroTailは現在アルファリリースです。安定したリリースのために、フィードバックをお寄せください

## デモ

- [ ] ここに画像を貼る

## クイックスタート

[Notro Connect](https://notro.mosugi.com/) (Notion Public Integration) で、IDやTokenを自動的に設定し、数ステップでNetlifyなどにデプロイ可能です。
早速試してみましょう！（リポジトリに⭐️をつけるのも忘れずに！）

[Notro ConnectでNetlifyやVercelに今すぐデプロイする](https://notro.mosugi.com/)

## 特徴

### 🚀コンテンツファースト

Notionの使いやすいインターフェースでコンテンツを作成し、Webサイトを構築できます。コーディングの知識は不要です

### ⚡️高いパフォーマンス

WebサイトはAstroによって静的なHTMLとして出力されるため、非常に高速でSEOにも最適化されます。個人のブログにもビジネス目的でも快適な体験を提供します

### 📷画像の最適化

Notionで利用している画像は、Astro Assetsによりデバイスごとに最適化されたWebP形式のファイルで配信されます

### 🎨モダンなスタイリング

TailwindCSSが提供するユーティリティが組み込まれており、モダンでレスポンシブなサイトを簡単に構築できます

### 📚テンプレート&フリーフォーマット

データベース形式のテンプレートからWebサイトを生成する方法のほか、特定のページからフリーフォーマットで作成することもできます

### 🔧高度なカスタマイズ

tailwind.cssで定義済みのCSSを変更することに加えて、本来の使い方と同じ様にNotionでも直接ユーティリティを適用でき、コンテンツに近い箇所で見た目を定義できます。さらにHTMLも書けるため高度なカスタマイズが可能です

## インストール方法

Notro Connect を利用せず、ローカル環境や任意の環境で動かす場合の方法です

### 1. Notion Internal Integrationを作成する

[Create an integration](https://developers.notion.com/docs/create-a-notion-integration##step-1-create-an-integration) からインテグレーションを作成し **Internal Integration Token** を `NOTION_TOKEN` として記録します

### 2. Notionページを選択または作成する

テンプレートを複製するか、既存のNotionページを選択します。NotroTailはどのNotionページでも機能しますが、テンプレートを利用するとヘッダーやブログ機能などのリッチな機能が利用できるようになります

### 3. NotionのIDを特定する

URLのID部を `NOTION_ID` として記録します

```plaintext
https://www.notion.so/myworkspace/a8aec43384f447ed84390e8e42c2e089?v=...
                                 |---------- NOTION_ID ----------|
```

### 4. Integrationを設定

 [Share a database with your integration](https://developers.notion.com/docs/create-a-notion-integration##step-2-share-a-database-with-your-integration) の手順でインテグレーションにページを共有します

### 5. 環境変数を指定

```bash
NOTION_ID=<NOTION_ID>
NOTION_SECRET=<NOTION_TOKEN>
```

### 6. 起動する

依存関係をインストールします

`npm install`

`npm run dev`

ブラウザで [http://localhost:4321](http://localhost:4321/) を開きます

## **Contributing**

バグ報告や機能要望は Issue を作成してください。どんなことでも、どんな言語でも大丈夫です。お気軽にどうぞ。プルリクエストももちろん歓迎します。

## Roadmap

- [ ] ビルド速度の向上
- [ ] 対応ブロックの増加
- [ ] Mermaidプレビューの対応
- [ ] iframeのドメインごとの対応
- [ ] RSSフィードの自動生成
- [ ] タグで記事を分類
- [ ] 記事のソーシャルシェア
- [ ] プロジェクトサイトマップの自動生成
- [ ] ソーシャルメディア共有のためのオープングラフタグ
- [ ] Tailwind Playと統合してプレビューしながらカスタマイズ
- [ ] Google Tag Managerとの統合を備えた分析機能
- [ ] カバー画像やプロパティを活用したリッチなデータベースの表示
- [ ] https://astro.build/blog/future-of-astro-content-layer/ に対応

## Licence

MIT

## Special Thanks

NotroTail は下記のリポジトリから着想を得て開発されました

- [Next.js Notion Starter Kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit)
    - 初めてNotionをベースとしてWebSiteを作るのに利用させてもらいました
- [Astro Notion Blog](https://github.com/otoyo/astro-notion-blog)
    - Astroベースのブログを作るのに利用させてもらいました
- [AstroWind](https://github.com/onwidget/astrowind)
    - デザインの参考にさせてもらいました
