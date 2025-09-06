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

async function handleMirror(url, res) {
  try {
    const response = await fetch(url);
    let contentType = response.headers.get("content-type") || "";
    res.set("Access-Control-Allow-Origin", "*");

    // If not HTML, just stream it
    if (!contentType.includes("text/html")) {
      const buffer = await response.buffer();
      res.set("content-type", contentType);
      return res.send(buffer);
    }

    // Parse HTML
    let html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 🔹 Remove <base> tags (force relative URLs to stay proxied)
    document.querySelectorAll("base").forEach(el => el.remove());

    // Rewrite attributes to proxy
    const rewriteAttr = (selector, attr) => {
      document.querySelectorAll(selector).forEach(el => {
        const val = el.getAttribute(attr);
        if (val) {
          const abs = absolutify(val, url);
          el.setAttribute(attr, `/mirror?url=${encodeURIComponent(abs)}`);
        }
      });
    };

    rewriteAttr("a[href]", "href");
    rewriteAttr("link[href]", "href");
    rewriteAttr("script[src]", "src");
    rewriteAttr("img[src]", "src");
    rewriteAttr("iframe[src]", "src");
    rewriteAttr("form[action]", "action");

    // 🔹 Inject anti-redirect JS
    const patch = document.createElement("script");
    patch.textContent = `
      // Block forced redirects
      Object.defineProperty(window, "location", {
        configurable: false,
        enumerable: true,
        value: { href: "about:blank" }
      });
    `;
    document.body.appendChild(patch);

    res.send(dom.serialize());
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}

// Mirror endpoint
app.get("/mirror", async (req, res) => {
  const target = req.query.url || TARGET_URL;
  await handleMirror(target, res);
});

app.listen(3000, () => {
  console.log("Proxy running at http://localhost:3000/mirror");
});
