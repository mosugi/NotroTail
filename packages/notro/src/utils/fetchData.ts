import pRetry from "p-retry";
import { getFromCache, setToCache } from "./cache.ts";

export const handleErrors = async <T>(
  promise: Promise<T>,
): Promise<T | null> => {
  try {
    return await promise;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const fetchData = async <T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  useCache: boolean = true,
  retries: number = 3,
): Promise<T | null> => {
  const cachedData = useCache ? await getFromCache<T>(cacheKey) : null;
  if (cachedData) return cachedData;

  const data = await handleErrors(pRetry(fetchFn, { retries }));

  if (useCache && data) await setToCache(cacheKey, data);
  return data;
};
