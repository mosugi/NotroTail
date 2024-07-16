import { getNotionBlock } from "notro";
import type { Page } from "notro/src/utils/notion/utils.ts";
import {
  getPageTypes,
  isChildDatabase,
  toPage,
} from "notro/src/utils/notion/utils.ts";
import { queryNotionDatabasePageAll } from "notro/src/utils/notion/api/databases.ts";

export const PageType = {
  Home: "Home",
  Header: "Header",
  Footer: "Footer",
  Collection: "Collection",
} as const;

export const fetchPagesByTemplate = async (
  databaseId: string,
): Promise<Page[]> => {
  return (
    await queryNotionDatabasePageAll({
      database_id: databaseId,
      filter: {
        property: "Public",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Order",
          direction: "ascending",
        },
        {
          property: "Page",
          direction: "ascending",
        },
      ],
    })
  )
    .map((page) => toPage(page, ""))
    .filter((page): page is Page => page !== null);
};

export const hasPageType = (
  page: Page,
  targetType: keyof typeof PageType,
): boolean => {
  return getPageTypes(page.response).some((type) => type.name === targetType);
};

export const getPagesByType = async (
  targetType?: keyof typeof PageType,
): Promise<Page[]> => {
  const block = await getNotionBlock({
    block_id: process.env.NOTION_ID as string,
  });

  if (!isChildDatabase(block)) return [];

  const pages = await fetchPagesByTemplate(process.env.NOTION_ID as string);

  return pages.filter((page): page is Page =>
    targetType ? hasPageType(page, targetType) : true,
  );
};

export const getStaticPathsForTemplate = async () => {
  const block = await getNotionBlock({
    block_id: process.env.NOTION_ID as string,
  });

  if (!isChildDatabase(block)) return [];

  const pages = await fetchPagesByTemplate(process.env.NOTION_ID as string);

  return pages.map((page) => {
    return {
      params: {
        slug: page.slug,
      },
      props: {
        title: page.title,
        page: page.response,
      },
    };
  });
};
