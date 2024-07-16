import type { Plugin } from "vite";
import type { ClientOptions } from "@notionhq/client/build/src/Client";

export function vitePluginNotionInit(options?: ClientOptions): Plugin {
  const virtualModuleId = "virtual:notion-init";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "vite-plugin-notion-init",
    async resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return `
          import { Client } from '@notionhq/client';
          export const notionClient = new Client(${JSON.stringify(options)});
        `;
      }
      return null;
    },
  };
}
