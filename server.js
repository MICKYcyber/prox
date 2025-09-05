const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('URL parameter is required');
  }

  try {
    const response = await axios.get(targetUrl, { responseType: 'text' });
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching the requested URL');
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
