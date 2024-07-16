import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getFromCache, setToCache } from "../cache.ts";
import { isNotPartialBlock } from "./utils.ts";
import { getNotionBlock, listNotionBlockChildrenAll } from "./api/blocks.ts";
import { queryNotionDatabasePageAll } from "./api/databases.ts";

export const fetchAllChildrenRecursive = async (
  blockId: string,
): Promise<BlockObjectResponse[]> => {
  const cacheKey = `fetchAllChildren:${blockId}`;
  const cachedData = await getFromCache<BlockObjectResponse[]>(cacheKey);
  if (cachedData) return cachedData;

  let allBlocks: BlockObjectResponse[] = [];

  const rootBlock = await getNotionBlock({ block_id: blockId });
  if (rootBlock && isNotPartialBlock(rootBlock)) {
    allBlocks.push(rootBlock);
    if (rootBlock.type !== "child_database" && !rootBlock.has_children)
      return allBlocks;
  }

  const blockIds = [blockId];
  if (
    rootBlock &&
    isNotPartialBlock(rootBlock) &&
    rootBlock.type === "child_database"
  ) {
    const databasePageBlocks = await queryNotionDatabasePageAll({
      database_id: rootBlock.id,
    });
    const databasePageIds = databasePageBlocks.map((page) => page.id);
    blockIds.push(...databasePageIds);
  }

  const blocksWithChildren = (
    await Promise.all(
      blockIds.map(
        async (id) => await listNotionBlockChildrenAll({ block_id: id }),
      ),
    )
  ).flat();

  if (!blocksWithChildren) return allBlocks;

  for (const block of blocksWithChildren) {
    allBlocks.push(block);

    if (block.type === "child_page") {
      const childBlocks = await fetchAllChildrenRecursive(block.id);
      allBlocks = allBlocks.concat(childBlocks);
    } else if (block.type === "child_database") {
      const databasePageBlocks = await queryNotionDatabasePageAll({
        database_id: block.id,
      });
      if (!databasePageBlocks) continue;

      for (const pageBlock of databasePageBlocks) {
        const childPageBlock = await getNotionBlock({ block_id: pageBlock.id });
        if (!childPageBlock) continue;
        const childBlocks = await fetchAllChildrenRecursive(pageBlock.id);
        allBlocks = allBlocks.concat(childBlocks);
      }
    } else {
      const blockId =
        block.type === "synced_block" &&
        block.synced_block?.synced_from?.block_id
          ? block.synced_block.synced_from.block_id
          : block.id;

      const childBlocks = await fetchAllChildrenRecursive(blockId);
      if (!childBlocks) continue;
      allBlocks = allBlocks.concat(childBlocks);
    }
  }

  if (allBlocks.length > 0) await setToCache(cacheKey, allBlocks);
  return allBlocks;
};
