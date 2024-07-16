import type { Page } from "./utils.ts";
import { getNotionBlock, listNotionBlockChildrenAll } from "./api/blocks.ts";
import { isNotPartialBlock, toPage } from "./utils.ts";
import { getNotionPage } from "./api/pages.ts";
import { queryNotionDatabasePageAll } from "./api/databases.ts";

export const fetchAllPagesRecursive = async (
  blockId: string,
  basePath: string = "",
  isRootBlock: boolean = false,
): Promise<Page[]> => {
  const block = await getNotionBlock({ block_id: blockId });
  if (!block || !isNotPartialBlock(block)) return [];

  const pages: Page[] = [];

  // Fetch child page if block is a page
  if (block.type === "child_page") {
    const page = await getNotionPage({ page_id: block.id });
    const templatePage = page ? toPage(page, basePath, isRootBlock) : null;
    templatePage ? pages.push(templatePage) : null;

    if (block?.has_children) {
      const childBlocks = await listNotionBlockChildrenAll({
        block_id: block.id,
      });
      const childPageOrDatabases = childBlocks?.filter(
        (block) =>
          block.type === "child_page" || block.type === "child_database",
      );

      for (const childPageOrDatabase of childPageOrDatabases || []) {
        const childPages = await fetchAllPagesRecursive(
          childPageOrDatabase.id,
          basePath ? basePath + templatePage?.slug : templatePage?.slug,
        );
        pages.push(...childPages);
      }
    }
  }

  // Fetch child database if block is a database
  if (block.type === "child_database") {
    const childDatabasePages = await queryNotionDatabasePageAll({
      database_id: block.id,
    });

    for (const childPage of childDatabasePages || []) {
      const childPages = await fetchAllPagesRecursive(childPage.id, basePath);
      pages.push(...childPages);
    }
  }
  return pages;
};
