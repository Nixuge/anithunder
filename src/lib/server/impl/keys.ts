import { cacheTime, redis } from "..";
import { fetchKeys } from "../../browser";
import { createResponse } from "../lib/response";

export const handler = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const paths = url.pathname.split("/");
        paths.shift();

        const cached = await redis.get(`keys`);
        if (cached) {
            return createResponse(cached);
        }

        const data = await fetchKeys();
        if (!data || data.length === 0) {
            return createResponse(JSON.stringify({ error: "No keys found. This might be an error." }), 404);
        }

        await redis.set(`keys`, JSON.stringify(data), "EX", cacheTime);

        return createResponse(JSON.stringify(data));
    } catch (e) {
        console.error(e);
        return createResponse(JSON.stringify({ error: "An error occurred." }), 500);
    }
};

const route = {
    path: "/keys",
    handler,
    rateLimit: 30,
};

export default route;
