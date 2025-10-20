/**
 * server.js - main entry for Seb's Unblocker V7
 *
 * - Serves public/index.html (your UI).
 * - /proxy?url=... -> uses staticProxy or dynamicProxy depending on heuristics.
 * - /resource?url=... -> returns raw asset content (used by rewritten links).
 *
 * Start: node server.js  (or npm run dev with nodemon)
 */

const express = require("express");
const path = require("path");
const { handleStaticProxy } = require("./proxy/staticProxy");
const { handleDynamicProxy } = require("./proxy/dynamicProxy");
const { isLikelyDynamic } = require("./proxy/utils");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, "public")));

// Health
app.get("/_health", (req, res) => res.send("ok"));

// Resource proxy - fetches raw resources (images, css, js, fonts, etc.)
app.get("/resource", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");
  // Let staticProxy or dynamicProxy use the /resource endpoint when rewriting assets.
  // We implement a basic pass-through using node-fetch in staticProxy if preferred.
  // For simplicity just reuse staticProxy behavior by delegating to handleStaticProxy for non-HTML resources.
  try {
    await handleStaticProxy(url, res, { resourceOnly: true });
  } catch (err) {
    console.error("Resource proxy error:", err);
    res.status(500).send("Resource proxy error: " + err.message);
  }
});

// Main proxy
app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing url");

  try {
    const useDynamic = isLikelyDynamic(target);
    if (useDynamic) {
      console.log("[PROXY] dynamic (puppeteer) ->", target);
      await handleDynamicProxy(target, res);
    } else {
      console.log("[PROXY] static ->", target);
      await handleStaticProxy(target, res);
    }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

// catch-all to serve index.html for any other route (optional)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Seb's Unblocker V7 running at http://localhost:${PORT}`);
});
