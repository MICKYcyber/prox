const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// Target site to proxy
const TARGET_URL = "https://sites.google.com/view/22y/";

// Proxy endpoint
app.get("/mirror", async (req, res) => {
  try {
    const response = await fetch(TARGET_URL);
    const html = await response.text();
    res.set("Access-Control-Allow-Origin", "*");
    res.send(html);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log("Proxy server running at http://localhost:" + PORT);
});
