declare module "virtual:*" {
  import type { IntegrationOptions } from "./src";
  const component: IntegrationOptions;
  export default component;
}
