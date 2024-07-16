import { createCache } from "cache-manager";
// @ts-ignore
import { DiskStore } from "cache-manager-fs-hash";

export const cache = createCache(
  new DiskStore({
    path: "./cache", // path for cached files
    ttl: import.meta.env.PROD ? 60 * 60 * 1000 : 10 * 1000, // 1 hour in production, 10 seconds in development
  }),
);
export const getFromCache = async <T>(cacheKey: string): Promise<T | null> => {
  const cachedData = await cache.get(cacheKey);
  if (cachedData) {
    console.log(`Fetched from cache: ${cacheKey}`);
    return cachedData as T;
  }
  return null;
};
export const setToCache = async (cacheKey: string, data: any) => {
  console.log(`Set cache: ${cacheKey}`);
  await cache.set(cacheKey, data);
};
