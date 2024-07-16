import type {
  BlockObjectResponse,
  DatabaseObjectResponse,
  GetBlockResponse,
  GetDatabaseResponse,
  GetPageResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export type PageOrDatabaseResponse =
  | PageObjectResponse
  | PartialPageObjectResponse
  | PartialDatabaseObjectResponse
  | DatabaseObjectResponse;

export interface OldPage {
  title: string;
  slug?: string;
  path?: string;
  response: PageObjectResponse;
}

export const getPageTitle = (page: PageObjectResponse): string => {
  const propertiesArray = Object.values(page.properties);
  const titleProperty = propertiesArray.find(
    (property) => property.type === "title",
  );

  if (titleProperty?.type === "title" && titleProperty.title.length > 0) {
    return titleProperty.title[0].plain_text;
  }

  return "";
};
export const getPageSlug = (page: PageObjectResponse): string => {
  const slugProperty = page.properties?.Slug || page.properties?.slug;
  if (
    slugProperty?.type === "rich_text" &&
    slugProperty.rich_text[0]?.plain_text !== undefined
  ) {
    return slugProperty.rich_text[0].plain_text;
  }
  return "";
};
export const getPagePublic = (page: PageObjectResponse): boolean => {
  const slugProperty = page.properties?.Public || page.properties?.public;
  if (slugProperty?.type === "checkbox") {
    return slugProperty.checkbox;
  }
  return true;
};
export const getPageTypes = (page: PageObjectResponse) => {
  const typeProperty = page.properties?.Type || page.properties?.type;
  if (
    typeProperty?.type === "multi_select" &&
    typeProperty.multi_select.length > 0
  ) {
    return typeProperty.multi_select;
  }
  return [];
};
export const isIndexSlug = (slug?: string): boolean => {
  return slug === undefined || slug === "index" || slug === "/" || slug === "";
};
export const isNotPartialPage = (
  block: GetPageResponse,
): block is PageObjectResponse => "url" in block;
const isNotPartialDatabase = (
  block: GetDatabaseResponse,
): block is DatabaseObjectResponse => "url" in block;
export const isNotPartialBlock = (
  block: GetBlockResponse,
): block is BlockObjectResponse => "type" in block;
export const isPageBlock = (
  block: PageOrDatabaseResponse,
): block is PageObjectResponse =>
  block.object === "page" && isNotPartialPage(block);
export const isDatabaseBlock = (
  block: PageOrDatabaseResponse,
): block is PageObjectResponse =>
  block.object === "database" && isNotPartialDatabase(block);

export const isChildPage = (block: GetBlockResponse | null): boolean => {
  return !!(block && "type" in block && block?.type === "child_page");
};

export const isChildDatabase = (block: GetBlockResponse | null): boolean => {
  return !!(block && "type" in block && block?.type === "child_database");
};

const formatPath = (path: string): string => {
  return path === "" || path.startsWith("/") ? path : "/" + path;
};
const compareWithoutHyphen = (str1?: string, str2?: string): boolean => {
  const formattedStr1 = str1?.replace(/-/g, "");
  const formattedStr2 = str2?.replace(/-/g, "");

  return formattedStr1 === formattedStr2;
};
export const isRootBlock = (blockId: string): boolean => {
  return compareWithoutHyphen(blockId, process.env.NOTION_ID);
};

const notionColors = {
  default: "notion-color-default",
  gray: "notion-color-gray",
  brown: "notion-color-brown",
  orange: "notion-color-orange",
  yellow: "notion-color-yellow",
  green: "notion-color-green",
  blue: "notion-color-blue",
  purple: "notion-color-purple",
  pink: "notion-color-pink",
  red: "notion-color-red",
  gray_background: "notion-color-gray_background",
  brown_background: "notion-color-brown_background",
  orange_background: "notion-color-orange_background",
  yellow_background: "notion-color-yellow_background",
  green_background: "notion-color-green_background",
  blue_background: "notion-color-blue_background",
  purple_background: "notion-color-purple_background",
  pink_background: "notion-color-pink_background",
  red_background: "notion-color-red_background",
} as const;

type NotionColor = keyof typeof notionColors;

export const getNotionColor = (color: NotionColor): string => {
  return notionColors[color];
};

export interface Page {
  id: string;
  title: string;
  path: string;
  slug?: string;
  public: boolean;
  properties: Record<string, any>;
  response: PageObjectResponse;
}

export const toPage = (
  page: PageObjectResponse,
  path: string = "",
  isIndex: boolean = false,
): Page => {
  return {
    id: page.id,
    title: getPageTitle(page),
    path: formatPath(path),
    slug: isIndex ? undefined : formatPath(getPageSlug(page) || page.id),
    public: getPagePublic(page),
    properties: page.properties,
    response: page,
  };
};

export const isPublicPage = (page: Page): boolean => {
  return page.public;
};
