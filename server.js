const express = require("express");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const app = express();

// Default site to mirror
const TARGET_URL = "https://sites.google.com/view/22y/";

function absolutify(url, base) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

// Core mirror handler
async function handleMirror(url, res) {
  try {
    const response = await fetch(url);
    let contentType = response.headers.get("content-type") || "";
    res.set("Access-Control-Allow-Origin", "*");

    // If it's not HTML, just pipe it back
    if (!contentType.includes("text/html")) {
      const buffer = await response.buffer();
      res.set("content-type", contentType);
      return res.send(buffer);
    }

    // Parse HTML and rewrite asset URLs
    let html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const rewriteAttr = (selector, attr) => {
      document.querySelectorAll(selector).forEach(el => {
        const val = el.getAttribute(attr);
        if (val) {
          const abs = absolutify(val, url);
          el.setAttribute(attr, `/mirror?url=${encodeURIComponent(abs)}`);
        }
      });
    };

    // Rewrite links/scripts/images/etc
    rewriteAttr("a[href]", "href");
    rewriteAttr("link[href]", "href");
    rewriteAttr("script[src]", "src");
    rewriteAttr("img[src]", "src");
    rewriteAttr("iframe[src]", "src");
    rewriteAttr("form[action]", "action");

    res.send(dom.serialize());
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}

// Default mirror endpoint
app.get("/mirror", async (req, res) => {
  const target = req.query.url || TARGET_URL;
  await handleMirror(target, res);
});

app.listen(3000, () => {
  console.log("Proxy running at http://localhost:3000/mirror");
});
