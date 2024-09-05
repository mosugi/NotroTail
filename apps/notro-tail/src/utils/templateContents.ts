import { getNotionBlock, listNotionBlockChildrenAll } from "notro";
import { isChildDatabase, toPage } from "notro/src/utils/notion/utils.ts";
import type { Page } from "notro/src/utils/notion/utils.ts";
import { fetchPagesByTemplate, hasPageType, PageType } from "./template.ts";
import type { ChildDatabaseBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { queryNotionDatabasePageAll } from "notro/src/utils/notion/api/databases.ts";

export interface PageWithDatabase {
  page: Page;
  database: ChildDatabaseBlockObjectResponse;
}

const toPageWithDatabase = (
  page: Page,
  databases: ChildDatabaseBlockObjectResponse[],
): PageWithDatabase[] => {
  return databases.map((database) => ({ page, database }));
};

const getChildDatabases = async (
  pageId: string,
): Promise<ChildDatabaseBlockObjectResponse[]> => {
  const children = await listNotionBlockChildrenAll({
    block_id: pageId,
  });
  return children.filter(
    (child): child is ChildDatabaseBlockObjectResponse =>
      child.type === "child_database",
  );
};

const fetchContentsByTemplate = async (path: string, databaseId: string) => {
  const pages = (await queryNotionDatabasePageAll({ database_id: databaseId }))
    .map((page) => toPage(page, path))
    .filter((page): page is Page => page !== null);

  return pages;
};

export const getStaticPathsForTemplateContents = async () => {
  const block = await getNotionBlock({
    block_id: process.env.NOTION_ID as string,
  });

  if (!isChildDatabase(block)) return [];

  const pages = await fetchPagesByTemplate(process.env.NOTION_ID as string);

  const collectionPages = pages.filter((page) =>
    hasPageType(page, PageType.Collection),
  );

  const collectionDatabases = await Promise.all(
    collectionPages.map(async (page) =>
      toPageWithDatabase(page, await getChildDatabases(page.response.id)),
    ),
  );

  const templateContents = await Promise.all(
    collectionDatabases
      .flat()
      .map(
        async (pageWithDatabase) =>
          await fetchContentsByTemplate(
            pageWithDatabase.page.slug || "",
            pageWithDatabase.database.id,
          ),
      ),
  );

  return templateContents.flat().map((page) => {
    return {
      params: {
        collection: page.path,
        slug: page.slug,
      },
      props: {
        page: page,
      },
    };
  });
};
