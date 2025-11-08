const express = require("express");
const mongoose = require("mongoose");
const body_parser = require("body-parser");
const cors = require('cors'); // 1. Import the cors package
const axios = require("axios");


const app = express();
app.use(body_parser.json());
const corsOptions = {
  origin:"http://localhost:5173", // Only allow requests from your frontend URL
};
app.use(cors(corsOptions)); 

const { router: seriesRoutes } = require("./series");
const { router: chapterRoutes } = require("./chapter");

mongoose.connect(
  "mongodb+srv://mahipalsinghapsit0:msdonrajputana@cluster0.am95irj.mongodb.net/manwha",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.use("/series", seriesRoutes);
app.use("/chapters", chapterRoutes);

// In backend/index.js

app.get('/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send('Image URL is required');
    }

    // --- THE FIX IS HERE ---
    // 1. Create a URL object from the image URL
    const urlObject = new URL(imageUrl);
    // 2. Get the origin (e.g., "https://arcanescans.com") to use as the Referer
    const referer = urlObject.origin;

    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream',
      headers: {
        // 3. Use the dynamic referer
        'Referer': referer,
        // It's also a good idea to add a User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      }
    });
    // --- END OF FIX ---

    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);

  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).send('Failed to fetch image');
  }
});
app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
