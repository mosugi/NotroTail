import type {
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { fetchData, handleErrors } from "../../fetchData.ts";
import { createNotionClient } from "./client.ts";
import { isPageBlock } from "../utils.ts";

const queryNotionDatabase = async (
  param: QueryDatabaseParameters,
  useCache: boolean = true,
): Promise<QueryDatabaseResponse | null> => {
  const cacheKey = `queryNotionDatabase:${param.database_id}:${param.start_cursor ?? ""}`;
  const notionClient = createNotionClient();
  return fetchData(
    cacheKey,
    () => notionClient.databases.query(param),
    useCache,
  );
};

export const queryNotionDatabasePageAll = async (
  param: QueryDatabaseParameters,
): Promise<PageObjectResponse[]> => {
  let allPages: PageObjectResponse[] = [];
  while (true) {
    const queryResult = await handleErrors(queryNotionDatabase(param));
    if (queryResult) {
      const pageOrDatabases = queryResult.results.filter(
        (block): block is PageObjectResponse => isPageBlock(block),
      );
      allPages = allPages.concat(pageOrDatabases);
      param["start_cursor"] = queryResult.next_cursor ?? undefined;
    }
    if (!queryResult?.has_more) break;
  }
  return allPages;
};
