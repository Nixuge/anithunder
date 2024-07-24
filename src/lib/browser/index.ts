import { env } from "../../env";

import colors from "colors";

import { executablePath as path } from "puppeteer";
import { CDPSession } from "puppeteer-core";
import chrome from "@sparticuz/chromium";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Interception, RequestInterceptionManager } from "puppeteer-intercept-and-modify-requests";
import { payload } from "./impl/payload/payload";
import { html } from "./impl/html/html";

export const fetchKeys = async (): Promise<string[]> => {
    const executablePath = path();

    const browserArgs = env.IS_PROD
        ? {
              args: chrome.args,
              defaultViewport: chrome.defaultViewport,
              executablePath,
              headless: true,
              ignoreHTTPSErrors: true,
          }
        : {
              args: ["--disable-web-security", "--disable-features=IsolateOrigins", "--disable-site-isolation-trials"],
              headless: true,
              executablePath,
          };

    const randomLetters = "zeiuzeygfzeurf";

    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch(browserArgs);

    const client = await browser.target().createCDPSession();
    const interceptManager = new RequestInterceptionManager(client as unknown as CDPSession);

    const page = await browser.newPage();

    const keys: string[] = [];

    try {
        const keysReq = page.waitForRequest((req) => req.url().includes(randomLetters), { timeout: 100000 });
        const otherInterceptionConf: Interception = {
            urlPattern: `*/mcloud/min/embed.js*`,
            resourceType: "Script",
            modifyResponse({ body }) {
                console.log(colors.gray("Replaced embed..."));
                return {
                    body: payload(randomLetters) + body,
                };
            },
        };

        console.log(colors.yellow("Starting key extraction..."));
        await interceptManager.intercept(otherInterceptionConf);
        console.log(colors.gray("Intercepted successfully. Loading page..."));
        await page.setContent(html());
        console.log(colors.gray("Page loaded successfully."));

        // Check if invalid from html
        if ((await page.content()).includes("We can't find the file you are looking for")) {
            console.error(colors.red("Unable to find keys file."));
            await browser.close();
        }

        console.log(colors.yellow("Waiting for request with keys..."));
        const keysUrlEncoded = await keysReq;

        console.log(colors.green("Got keys, trying to parse..."));

        keys.push(...JSON.parse(decodeURIComponent(keysUrlEncoded.url().split("/").at(-1)!)));
    } catch (e) {
        console.error(e);
        console.error(colors.red("Failed to extract keys."));
    }

    await browser.close();
    return keys;
};
