import type {
  BlockObjectResponse,
  GetBlockParameters,
  GetBlockResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { fetchData } from "../../fetchData.ts";
import { createNotionClient } from "./client.ts";
import { isNotPartialBlock } from "../utils.ts";

export const getNotionBlock = async (
  param: GetBlockParameters,
  useCache: boolean = true,
): Promise<GetBlockResponse | null> => {
  const cacheKey = `getNotionBlock:${param.block_id}`;
  const notionClient = createNotionClient();
  return fetchData(
    cacheKey,
    () => notionClient.blocks.retrieve(param),
    useCache,
  );
};
export const listNotionBlockChildren = async (
  param: ListBlockChildrenParameters,
  useCache: boolean = true,
): Promise<ListBlockChildrenResponse | null> => {
  const cacheKey = `listNotionBlockChildren:${param.block_id}:${param.start_cursor ?? ""}`;
  const notionClient = createNotionClient();
  return fetchData(
    cacheKey,
    () => notionClient.blocks.children.list(param),
    useCache,
  );
};

export const listNotionBlockChildrenAll = async (
  param: ListBlockChildrenParameters,
  useCache: boolean = true,
): Promise<BlockObjectResponse[]> => {
  let allBlocks: BlockObjectResponse[] = [];
  while (true) {
    const blockChildren = await listNotionBlockChildren(param, useCache);
    if (!blockChildren) break;
    const blocks = blockChildren.results.filter(
      (block): block is BlockObjectResponse => isNotPartialBlock(block),
    );
    allBlocks = allBlocks.concat(blocks);
    param["start_cursor"] = blockChildren.next_cursor ?? undefined;
    if (!blockChildren.has_more) break;
  }
  return allBlocks;
};
