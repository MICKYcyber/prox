const express = require("express");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

const app = express();

// Change this to your protected site
const TARGET_URL = "https://sites.google.com/view/22y/";

app.get("/mirror", async (req, res) => {
  try {
    const response = await fetch(TARGET_URL);
    let html = await response.text();

    // Rewrite asset URLs to go through proxy
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // handle <link>, <script>, <img>, <a>
    document.querySelectorAll("link[href], script[src], img[src], a[href]").forEach(el => {
      let attr = el.tagName === "A" ? "href" : (el.hasAttribute("src") ? "src" : "href");
      const url = el.getAttribute(attr);
      if (url && !url.startsWith("http")) {
        el.setAttribute(attr, TARGET_URL + url);
      }
    });

    html = dom.serialize();

    res.set("Access-Control-Allow-Origin", "*");
    res.send(html);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(3000, () => {
  console.log("Proxy server running on port 3000");
});
