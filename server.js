const express = require("express");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const app = express();

const TARGET_URL = "https://sites.google.com/view/22y/";

function absolutify(url, base) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

app.get("/mirror", async (req, res) => {
  try {
    const response = await fetch(TARGET_URL);
    let html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Rewriting function
    const rewriteAttr = (selector, attr) => {
      document.querySelectorAll(selector).forEach(el => {
        const val = el.getAttribute(attr);
        if (val) {
          const abs = absolutify(val, TARGET_URL);
          el.setAttribute(attr, `/mirror?url=${encodeURIComponent(abs)}`);
        }
      });
    };

    // Rewrite all important tags
    rewriteAttr("a[href]", "href");
    rewriteAttr("link[href]", "href");
    rewriteAttr("script[src]", "src");
    rewriteAttr("img[src]", "src");
    rewriteAttr("iframe[src]", "src");
    rewriteAttr("form[action]", "action");

    html = dom.serialize();

    res.set("Access-Control-Allow-Origin", "*");
    res.send(html);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

// Handle /mirror?url=...
app.get("/mirror", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  try {
    const response = await fetch(url);
    res.set("Access-Control-Allow-Origin", "*");
    res.send(await response.text());
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(3000, () => {
  console.log("Proxy running at http://localhost:3000");
});
