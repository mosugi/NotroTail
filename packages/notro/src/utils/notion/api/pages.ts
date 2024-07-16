import type {
  GetPageParameters,
  GetPageResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { fetchData } from "../../fetchData.ts";
import { createNotionClient } from "./client.ts";
import { isNotPartialPage } from "../utils.ts";

export const getNotionPage = async (
  param: GetPageParameters,
  useCache: boolean = true,
): Promise<PageObjectResponse | null> => {
  const cacheKey = `getNotionPage:${param.page_id}`;
  const notionClient = createNotionClient();
  const data = await fetchData<GetPageResponse | null>(
    cacheKey,
    () => notionClient.pages.retrieve(param),
    useCache,
  );
  return data && isNotPartialPage(data) ? data : null;
};
