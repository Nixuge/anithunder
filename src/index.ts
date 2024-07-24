import dotenv from "dotenv";
import { fetchKeys } from "./lib/browser";
dotenv.config();

(async () => {
    console.log(await fetchKeys());
})().catch(console.error);
