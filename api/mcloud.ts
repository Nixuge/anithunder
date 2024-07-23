import puppeteer from 'puppeteer-extra';
import chrome from '@sparticuz/chromium';
import { Browser } from 'puppeteer-core';

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


interface FinalResponse {
  source: string
  tracks: Track[]
}
// interface SourcesResponse {
//   sources: string,
//   tracks: Track[]
// }

interface Track {
  file: string,
  label: string,
  kind: string
  default?: boolean
}

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

  // Some checks...
  if (!body) return res.status(400).end(`No body provided`)
  if (typeof body === 'object' && !body.url) return res.status(400).end(`No URL provided`)
  
  const url = body.url;
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
  const page = await browser.newPage();

  // DEBUG - VERY USEFUL 
  // LOG ON REQUEST
  // function logRequest(interceptedRequest: HTTPRequest) {
  //   console.log('A request was made:', interceptedRequest.url());
  // }
  // page.on('request', logRequest);
  //
  // LOG ON RESPONSE
  // function logResponse(response: HTTPResponse) {
  //   console.log("Response: " + response.url());
  // }
  // page.on('response', logResponse);
  // END DEBUG

  // Set headers,else wont work.
  // await page.setExtraHTTPHeaders({ 'Referer': 'https://aniwave.to/' });
  
  let finalResponse: FinalResponse

  try {
    // Note: need to add the catches to avoid crashing (which the catch below doesn't catch bc promises)
    const sourcesReq = page.waitForResponse(req => req.url().includes("/mediainfo/"), { timeout: 10000 }).catch(_ => console.warn("Task cancelled."))!;
    // const finalReq = page.waitForRequest(req => req.url().includes('.m3u8'), { timeout: 10000 }).catch(_ => console.warn("Task cancelled."));

    await page.goto(`${url}&autostart=true`, { waitUntil: 'domcontentloaded' });

    // Check if invalid from html
    if ((await page.content()).includes("We can't find the file you are looking for")) {      
      console.error(`Invalid url: ${url}`);
      await browser.close();
      return res.status(400).end("Invalid ID");
    }

    finalResponse = await sourcesReq.then(resp => resp!.json());

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
  console.log(finalResponse);
  res.json(finalResponse);
};
