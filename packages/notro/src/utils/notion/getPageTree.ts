import type { OldPage } from "./utils.ts";
import { isNotPartialBlock, isRootBlock, toPage } from "./utils.ts";
import { getNotionBlock } from "./api/blocks.ts";
import { getNotionPage } from "./api/pages.ts";

export const getAncestorPagesRecursive = async (
  blockId: string,
): Promise<OldPage[]> => {
  const block = await getNotionBlock({ block_id: blockId });
  const parent = block && isNotPartialBlock(block) ? block?.parent : null;

  if (!parent) return [];

  if (parent.type === "page_id" && parent.page_id) {
    if (isRootBlock(parent.page_id)) return [];
    const notionPage = await getNotionPage({ page_id: parent.page_id });
    const page = notionPage ? toPage(notionPage) : null;
    const ancestors = await getAncestorPagesRecursive(parent.page_id);
    return page ? [...ancestors, page] : ancestors;
  } else if (parent.type === "database_id" && parent.database_id) {
    return await getAncestorPagesRecursive(parent.database_id);
  } else if (parent.type === "block_id" && parent.block_id) {
    return await getAncestorPagesRecursive(parent.block_id);
  } else {
    return [];
  }
};

export const getPathFromAncestorPages = (ancestorPages: OldPage[]): string => {
  return ancestorPages.reduce((path, page) => {
    return path + page.slug;
  }, "");
};
