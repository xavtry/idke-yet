/**
 * dynamicProxy.js
 *
 * Uses Puppeteer to load the page, wait for network idle, then return rendered HTML.
 * After grabbing HTML, rewrites href/src/action similarly to staticProxy so navigation stays inside proxy.
 *
 * Important: this is a snapshot (server-side rendered HTML). Interactive features depending on client-side
 * origin (websockets, strict CORS-bound APIs) may still break.
 */

const puppeteer = require("puppeteer");

let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
  }
  return browserPromise;
}

async function handleDynamicProxy(targetUrl, res) {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36");
    await page.setViewport({ width: 1200, height: 900 });

    // optional: intercept requests to speed up or block trackers (disabled by default)
    // await page.setRequestInterception(true);
    // page.on('request', req => {
    //   const url = req.url();
    //   if (url.includes('doubleclick') || url.includes('google-analytics')) return req.abort();
    //   req.continue();
    // });

    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 30000 }).catch(e => { /* continue */ });
    await page.waitForTimeout(500); // small extra wait

    let content = await page.content();
    await page.close();

    // rewrite links similarly to staticProxy
    content = content.replace(/(href|src|action)=["']([^"']+)["']/g, (m, attr, link) => {
      try {
        if (/^\s*javascript:/i.test(link) || /^\s*mailto:/i.test(link) || link.startsWith('#')) return m;
        const abs = new URL(link, targetUrl).href;
        const ext = (abs.split('?')[0].split('#')[0].split('.').pop() || "").toLowerCase();
        const assetExts = ["css","js","png","jpg","jpeg","gif","svg","webp","woff","woff2","ttf","otf","map","ico","json","mp4","webm"];
        if (assetExts.includes(ext)) return `${attr}="/resource?url=${encodeURIComponent(abs)}"`;
        return `${attr}="/proxy?url=${encodeURIComponent(abs)}"`;
      } catch (err) {
        return m;
      }
    });

    // inject base tag if missing
    try {
      const u = new URL(targetUrl);
      if (!/ <base /i.test(content)) {
        content = content.replace(/<head([^>]*)>/i, match => `${match}\n    <base href="${u.origin}/">`);
      }
    } catch {}

    res.setHeader("content-type", "text/html; charset=utf-8");
    res.send(content);
  } catch (err) {
    console.error("dynamicProxy error:", err);
    throw err;
  }
}

module.exports = { handleDynamicProxy };
