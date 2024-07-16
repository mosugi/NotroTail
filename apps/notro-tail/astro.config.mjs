import {defineConfig} from "astro/config";

import tailwind from "@astrojs/tailwind";
import notro from "notro";

export default defineConfig({
    image: {
        remotePatterns: [{ protocol: "https" }],
    },
    integrations: [
        tailwind(),
        notro({
            token: process.env.NOTION_TOKEN,
            notionId: process.env.NOTION_ID,
            optimizeRemoteImage: true,
            useRawHtml: true,
            enableCalloutAsWrapper: true,
            fetchAllPagesOnServerStart: false
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
