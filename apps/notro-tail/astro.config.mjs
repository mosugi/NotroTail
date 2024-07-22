import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import notro from "notro";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://notrotail.mosugi.com',
  image: {
    remotePatterns: [
      {
        protocol: "https",
      },
    ],
  },
  integrations: [
    tailwind(),
    sitemap(),
    notro({
      token: process.env.NOTION_TOKEN,
      notionId: process.env.NOTION_ID,
      optimizeRemoteImage: true,
      useRawHtml: true,
      enableCalloutAsWrapper: true,
      fetchAllPagesOnServerStart: false,
    }),
  ],
  vite: {
    server: {
      watch: {
        ignored: ["**/cache/**/*"],
      },
    },
  },
});
