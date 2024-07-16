import type { Plugin } from "vite";
import type { IntegrationOptions } from "../index.ts";

export function vitePluginNotroOptions(options: IntegrationOptions): Plugin {
  const virtualModuleId = `virtual:notro-options`;
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "vite-plugin-notro-options",
    async resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return `export default ${JSON.stringify(options)}`;
      }
    },
  };
}
