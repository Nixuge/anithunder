// All environment variables.
export const env = {
    IS_PROD: process.env.NODE_ENV === "production",
    REDIS_URL: process.env.REDIS_URL,
    REDIS_CACHE_TIME: Number(process.env.REDIS_CACHE_TIME ?? 60 * 60 * 24 * 7),
    PORT: Number(process.env.PORT ?? 3000),
};
