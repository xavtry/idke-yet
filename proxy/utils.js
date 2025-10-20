/**
 * utils.js
 * Utility helpers: dynamic detection, safe URL parse, etc.
 */

const url = require("url");

/**
 * Quick heuristic to decide if we should use Puppeteer.
 * Expand this list with domains you know are heavy.
 */
const dynamicHostHints = [
  "coolmathgames",
  "class-77",
  "itch.io",
  "roblox",
  "miniclip",
  "kongregate",
  "armorgames",
  "scirra"
];

function isLikelyDynamic(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const hostname = u.hostname.toLowerCase();
    return dynamicHostHints.some(h => hostname.includes(h));
  } catch (err) {
    return false;
  }
}

module.exports = { isLikelyDynamic };
