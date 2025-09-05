const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// Proxy endpoint
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing url parameter");

  try {
    const response = await axios.get(targetUrl, { responseType: "arraybuffer" });
    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
