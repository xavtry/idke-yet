/**
 * staticProxy.js
 *
 * Fetches HTML with node-fetch, rewrites links (href/src/action) to /proxy or /resource,
 * and pipes non-HTML resources directly when asked (resourceOnly mode).
 *
 * Uses Cheerio for robust DOM rewrites.
 */

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const mime = require("mime");

async function handleStaticProxy(targetUrl, res, opts = {}) {
  // opts.resourceOnly: if true, just fetch and stream as-is (non-HTML expected).
  try {
    const remote = await fetch(targetUrl, { redirect: "follow", timeout: 20000 });
    const contentType = remote.headers.get("content-type") || "";

    // If caller asked for a resource only, just stream bytes
    if (opts.resourceOnly || !contentType.includes("text/html")) {
      const buffer = await remote.buffer();
      res.setHeader("content-type", contentType || mime.getType(targetUrl) || "application/octet-stream");
      return res.send(buffer);
    }

    // For HTML: rewrite
    const rawHtml = await remote.text();
    const $ = cheerio.load(rawHtml);

    // Insert <base> to help relative URL resolution for scripts/styles that rely on it
    try {
      const u = new URL(targetUrl);
      const baseTag = `<base href="${u.origin}/">`;
      const head = $("head");
      if (head.length > 0) head.prepend(baseTag);
      else $("html").prepend(`<head>${baseTag}</head>`);
    } catch (err) {
      // ignore
    }

    // Rewrite attributes
    const rewriteAttr = (el, attr) => {
      const val = $(el).attr(attr);
      if (!val) return;
      // ignore javascript: and mailto: and anchors
      if (/^\s*javascript:/i.test(val) || /^\s*mailto:/i.test(val) || val.startsWith("#")) return;
      try {
        const abs = new URL(val, targetUrl).href;
        // asset extension check
        const ext = (abs.split('?')[0].split('#')[0].split('.').pop() || "").toLowerCase();
        const assetExts = ["css","js","png","jpg","jpeg","gif","svg","webp","woff","woff2","ttf","otf","map","ico","json","mp4","webm"];
        if (assetExts.includes(ext)) {
          $(el).attr(attr, `/resource?url=${encodeURIComponent(abs)}`);
        } else {
          $(el).attr(attr, `/proxy?url=${encodeURIComponent(abs)}`);
        }
      } catch (err) {
        // leave as-is
      }
    };

    // elements to rewrite
    $("a[href], link[href], script[src], img[src], iframe[src], form[action]").each((i, el) => {
      if (el.name === "a" || el.name === "link" || el.name === "script" || el.name === "img" || el.name === "iframe") {
        const attr = el.name === "img" || el.name === "iframe" || el.name === "script" ? "src" : "href";
        if (!$(el).attr(attr)) {
          // fallback to action for forms
          if (el.name === "form" && $(el).attr("action")) rewriteAttr(el, "action");
        } else rewriteAttr(el, attr);
      } else if (el.name === "form") {
        rewriteAttr(el, "action");
      }
    });

    // small injection to route window.open calls back through proxy
    $("body").append(`<script>
      (function(){
        const origOpen = window.open;
        window.open = function(u, name) {
          try {
            const parsed = new URL(u, location.href);
            location.href = '/proxy?url=' + encodeURIComponent(parsed.href);
            return null;
          } catch(e){
            return origOpen.apply(this, arguments);
          }
        };
      })();
    </script>`);

    res.setHeader("content-type", "text/html; charset=utf-8");
    res.send($.html());
  } catch (err) {
    console.error("staticProxy error:", err);
    throw err;
  }
}

module.exports = { handleStaticProxy };
