import type {
  SearchParameters,
  SearchResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { fetchData, handleErrors } from "../../fetchData.ts";
import { createNotionClient } from "./client.ts";

const searchNotion = async (
  param: SearchParameters,
  useCache: boolean = true,
): Promise<SearchResponse | null> => {
  const cacheKey = `searchNotion:${param.query}:${param.start_cursor}`;
  const notionClient = createNotionClient();
  return fetchData(cacheKey, () => notionClient.search(param), useCache);
};
export const fetchAllSearchResults = async () => {
  let allResults: SearchResponse["results"] = [];
  const searchParam: SearchParameters = {
    query: "",
    sort: {
      timestamp: "last_edited_time",
      direction: "descending",
    },
  };
  while (true) {
    const searchResult = await handleErrors(searchNotion(searchParam));
    if (searchResult) {
      allResults = allResults.concat(searchResult.results);
      searchParam["start_cursor"] = searchResult.next_cursor ?? undefined;
    }
    if (!searchResult?.has_more) break;
  }
  return allResults;
};
