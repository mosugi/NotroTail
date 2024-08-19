import type { AstroIntegration } from "astro";
import { Client } from "@notionhq/client";
import { vitePluginNotionInit } from "./vite-plugins/vite-plugin-notion-init";
import { fetchAllChildrenRecursive } from "./utils/notion/fetchAllBlocks.ts";
import {
  listNotionBlockChildrenAll,
  getNotionBlock,
} from "./utils/notion/api/blocks.ts";
import { vitePluginNotroOptions } from "./vite-plugins/vite-plugin-notion-options.ts";
import { fetchAllPagesRecursive } from "./utils/notion/fetchAllPages.ts";
import type { QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";

export {
  fetchAllChildrenRecursive,
  listNotionBlockChildrenAll,
  getNotionBlock,
};

export type IntegrationOptions = {
  token: string;
  notionId: string;
  optimizeRemoteImage: boolean;
  useRawHtml: boolean;
  enableCalloutAsWrapper: boolean;
  fetchAllPagesOnServerStart: boolean;
  queryChildDatabaseParameters: QueryDatabaseParameters;
  visibleChildDatabaseProperties: string[];
};

function initializeNotionClient(token: string) {
  // @ts-ignore
  if (!globalThis.notionClientInstance) {
    // @ts-ignore
    globalThis.notionClientInstance = new Client({
      auth: token,
    });
  }
}

export function getNotionClient() {
  //@ts-ignore
  if (!globalThis.notionClientInstance) {
    throw new Error("Notion client is not initialized");
  }
  //@ts-ignore
  return globalThis.notionClientInstance;
}

const notro = (config: IntegrationOptions): AstroIntegration => {
  return {
    name: "notro",
    hooks: {
      "astro:config:setup": async ({ updateConfig, injectScript }) => {
        updateConfig({
          vite: {
            plugins: [
              vitePluginNotionInit({
                auth: config.token,
              }),
              vitePluginNotroOptions(config),
            ],
          },
        });

        injectScript(
          "page-ssr",
          `
          import { notionClient } from "virtual:notion-init";
          globalThis.notionClientInstance = notionClient;
          `,
        );
      },
      "astro:server:start": async () => {
        if (config.fetchAllPagesOnServerStart) {
          initializeNotionClient(config.token);
          await fetchAllPagesRecursive(config.notionId as string);
        }
      },
      "astro:build:start": async () => {
        console.log("Fetching all blocks...");
        console.time("All blocks fetched");
        initializeNotionClient(config.token);
        await fetchAllChildrenRecursive(config.notionId as string);
        console.timeEnd("All blocks fetched");
      },
    },
  };
};

export default notro;
