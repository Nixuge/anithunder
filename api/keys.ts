import puppeteer from 'puppeteer-extra';
import chrome from '@sparticuz/chromium';
import { Browser, Page } from 'puppeteer-core';

import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin())

// Stealth plugin issue - There is a good fix but currently this works.
require('puppeteer-extra-plugin-user-data-dir')
require('puppeteer-extra-plugin-user-preferences')
require('puppeteer-extra-plugin-stealth/evasions/chrome.app')
require('puppeteer-extra-plugin-stealth/evasions/chrome.csi')
require('puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes')
require('puppeteer-extra-plugin-stealth/evasions/chrome.runtime')
require('puppeteer-extra-plugin-stealth/evasions/defaultArgs') // pkg warned me this one was missing
require('puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow')
require('puppeteer-extra-plugin-stealth/evasions/media.codecs')
require('puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency')
require('puppeteer-extra-plugin-stealth/evasions/navigator.languages')
require('puppeteer-extra-plugin-stealth/evasions/navigator.permissions')
require('puppeteer-extra-plugin-stealth/evasions/navigator.plugins')
require('puppeteer-extra-plugin-stealth/evasions/navigator.vendor')
require('puppeteer-extra-plugin-stealth/evasions/navigator.webdriver')
require('puppeteer-extra-plugin-stealth/evasions/sourceurl')
require('puppeteer-extra-plugin-stealth/evasions/user-agent-override')
require('puppeteer-extra-plugin-stealth/evasions/webgl.vendor')
require('puppeteer-extra-plugin-stealth/evasions/window.outerdimensions')


import { PuppeteerBlocker } from '@cliqz/adblocker-puppeteer';
import fetch from 'cross-fetch'; // required 'fetch'

import { Interception, RequestInterceptionManager } from 'puppeteer-intercept-and-modify-requests'

const payloadLmao = `
// alert("hi!!");
const log = console.log;
console.log = () => {};
console.clear = () => {};
console.table = () => {};

const serialize = [];
const deserialize = [];

let deserializing = false;

function add(funcName, args) {
  // Deserializing always starts w a deserialize func, once we got the first one we can switch
  if (funcName == "deserialize") {
    deserializing = true;
  }
  let obj = {};
  obj[funcName] = args;
  if (deserializing) {
    deserialize.push(obj)
  } else {
    serialize.push(obj)
  }
}


setTimeout(() => {
  // alert(JSON.stringify(all, undefined, 2));
  fetch("https://zeiuzeygfzeurf.org/" + encodeURIComponent(JSON.stringify({"serialize": serialize, "deserialize": deserialize})));
}, 5000)
`

const replacementHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <iframe src="https://vid2a41.site/e/QVY9ZG10EY2M?autostart=true" allow="autoplay; fullscreen" allowfullscreen="yes" frameborder="no" scrolling="no" style="width: 100%; height: 100%; overflow: hidden;"></iframe>
</body>
</html>`


const regex = /function [a-zA-Z]\([a-zA-Z],[a-zA-Z]\)\{((?:(?!function).)*)\}function [a-zA-Z]\([a-zA-Z]\)\{((?:(?!function).)*)\}function [a-zA-Z]\([a-zA-Z]\)\{((?:(?!function).)*)\}function [a-zA-Z]\(([a-zA-Z],[a-zA-Z],[a-zA-Z])\)\{((?:(?!function).)*)\}function [a-zA-Z]\([a-zA-Z]\)\{((?:(?!function).)*)\}/gs;
const funcs = [
  ["_BASE PLACEHOLDER_", -1, -1],
  ["rc4", 0, 1],
  ["serialize", 0, 0],
  ["deserialize", 0, 0],
  ["_ARGS PLACEHOLDER", -1, -1],
  ["substitute", 1, 3],
  ["reverse", 1, 1]
]

export default async (req: any, res: any) => {
  let {body,method} = req  

  // Some header shits
  if (method !== 'POST') {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    return res.status(200).end()
  }

  const url = "https://aniwave.to/watch/one-piece.ov8/ep-1"
  const isProd = process.env.NODE_ENV === 'production'

  // create browser based on ENV
  let browser: Browser;

  const otherArgs = [
    '--disable-web-security',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials'
  ]

  if (isProd) {
    browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true
    })
  } else {
    const pathes = {
      "_win32": "...",
      "linux": "/usr/bin/google-chrome-stable",
      "darwin": "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
    }
    const browserPath = pathes[process.platform];
    if (browserPath == undefined) {
      throw Error("Unavailable platform.")
    }
    browser = await puppeteer.launch({
      args: otherArgs,
      headless: false,
      executablePath: browserPath,
    })
  }
  const client = await browser.target().createCDPSession();
  const interceptManager = new RequestInterceptionManager(client);

  const page = await browser.newPage();
  // await page.setRequestInterception(true);
  PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInPage(page);
  });

  let keys: string[];

  try {
    const keysReq = page.waitForRequest(req => req.url().includes("zeiuzeygfzeurf"), {timeout: 10000});

    const otherInterceptionConf: Interception = {
      urlPattern: `*/megaf/min/embed.js*`,
      resourceType: 'Script',
      modifyResponse({ body }) {
        const match = body!.matchAll(regex).next().value;
        const replacements: string[] = match.map((code: string, num: string) => {
          return code;
        });
        if (replacements.length != 7) {
          throw Error("Wrong size: " + replacements.length);
        };
        const argNames = replacements[4].split(",");

        for (let i = 1; i < replacements.length; i++) {
          if (i == 4) { // arg names match
            continue;
          } 
          const element = replacements[i];
          // Can't simple unwrap bc ts doesn't realize how its done
          let out = funcs[i];
          let funcName = out[0] as string;
          let firstImportantArg = out[1] as number;
          let lastImportantArg = out[2] as number;

          console.log(`[${i}] Func: ${funcName}, elem: ${element}`);
                    
          const rawArgs = argNames.slice(firstImportantArg, lastImportantArg).join(",");
          
          body = body?.replace(element, `add("${funcName}", [${rawArgs}]); ${element}`);
        }

        // What this does?
        // Basically, by default, if the url is invalid (whether the embed id is invalid OR the t param is too old), 
        // aniwave will STILL run the method.
        // 
        // If it's valid, the method will process as intended.
        // HOWEVER, if it isn't, it'll fail at the "deserialize" part, and the website will catch that (since if invalid the result 
        // is set to 403, a number, instead of some text).
        // That means, if we just fake the result of deserialize so that it doesn't error out, we can extract the instructions & keys
        // even from INVALID urls. This is what this does.
        // Can now technically set the url after /e/ to ANYTHING and still have a working extractor.
        body = body?.replace(replacements[3], `return ${argNames[0]};`)
        
        console.log("Replaced embed.");
        return {
          body: payloadLmao + body
        }
      },
    }

    console.log("Starting...");
    await interceptManager.intercept(otherInterceptionConf)
    await page.setContent(replacementHtml)
    console.log("Page loaded.");

    // Check if invalid from html
    if ((await page.content()).includes("We can't find the file you are looking for")) {      
      console.error(`Invalid url: ${url}`);
      await browser.close();
      return res.status(400).end("Invalid ID");
    }

    console.log("Waiting for request with keys...");
    const keysUrlEncoded = await keysReq;
    
    console.log("Got keys, trying to parse...");
    
    keys = JSON.parse(decodeURIComponent(keysUrlEncoded.url().split("/").at(-1)!));
  } catch (error) {
    // Just in case
    console.error("Catched error: " + error);
    return res.status(500).end("Server error.")
  }

  await browser.close();

  // Response headers.
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate')
  res.setHeader('Content-Type', 'application/json')
  // CORS
  // res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  console.log("Success !");
  console.log(keys);
  res.json(keys);
};
