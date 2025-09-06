const express = require("express");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const app = express();

const TARGET_URL = "https://sites.google.com/view/22y/";

// Helper to convert relative URLs to absolute
function absolutify(url, base) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

// Function to fetch and rewrite HTML
async function handleMirror(url, res, tabName) {
  try {
    const response = await fetch(url);
    let contentType = response.headers.get("content-type") || "";
    res.set("Access-Control-Allow-Origin", "*");

    if (!contentType.includes("text/html")) {
      const buffer = await response.buffer();
      res.set("content-type", contentType);
      return res.send(buffer);
    }

    let html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove <base> tags
    document.querySelectorAll("base").forEach(el => el.remove());

    // Rewrite URLs to go through this proxy
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

    // Inject anti-redirect JS
    const patch = document.createElement("script");
    patch.textContent = `
      Object.defineProperty(window, "location", {
        configurable: false,
        enumerable: true,
        value: { href: "about:blank" }
      });
    `;
    document.body.appendChild(patch);

    // 🔹 Inject tab-specific content
    const header = document.createElement("div");
    header.style.cssText = "background:#00796b;color:#fff;padding:10px;text-align:center;font-weight:bold;";
    header.textContent = `You are viewing: ${tabName}`;
    document.body.prepend(header);

    // Only show this tab's content
    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach(el => {
      if (el !== header && el.tagName !== "SCRIPT") {
        el.style.display = "block"; // Keep relevant content
      }
    });

    res.send(dom.serialize());
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}

// Mirror endpoints for each tab
app.get("/tab/:tabName", async (req, res) => {
  const { tabName } = req.params;

  // Map tabs to different URLs or content
  let url;
  switch (tabName) {
    case "chat1":
      url = TARGET_URL + "chat1";
      break;
    case "chat2":
      url = TARGET_URL + "chat2";
      break;
    case "chat3":
      url = TARGET_URL + "chat3";
      break;
    case "chat4":
      url = TARGET_URL + "chat4";
      break;
    case "chat5":
      url = TARGET_URL + "chat5";
      break;
    case "server":
      url = TARGET_URL + "server";
      break;
    default:
      return res.status(404).send("Tab not found");
  }

  await handleMirror(url, res, tabName);
});

app.listen(3000, () => {
  console.log("Proxy running at http://localhost:3000/tab/chat1");
});
