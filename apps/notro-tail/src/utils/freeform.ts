import { getNotionBlock } from "notro";
import { fetchAllPagesRecursive } from "notro/src/utils/notion/fetchAllPages.ts";
import { isChildPage, isPublicPage } from "notro/src/utils/notion/utils.ts";

export const getStaticPathsFromAllBlocksRecursive = async () => {
  const block = await getNotionBlock({
    block_id: process.env.NOTION_ID as string,
  });

  if (!isChildPage(block)) return [];

  const pages = await fetchAllPagesRecursive(
    process.env.NOTION_ID as string,
    "",
    true,
  );

  return pages.filter(isPublicPage).map((page) => {
    return {
      params: {
        // TODO is this necessary?
        path: page.slug ? page.path + page.slug : undefined,
      },
      props: {
        title: page.title,
        page: page.response,
      },
    };
  });
};
