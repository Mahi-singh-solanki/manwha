const express = require("express");
const mongoose = require("mongoose");
const body_parser = require("body-parser");
const cors = require('cors'); // 1. Import the cors package
const axios = require("axios");


const app = express();
app.use(body_parser.json());
const corsOptions = {
  origin:"https://mahi-manwha.netlify.app", // Only allow requests from your frontend URL
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

app.get('/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send('Image URL is required');
    }

    // Fetch the image from the original source as a stream
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream',
      headers: {
        // Some image hosts require a Referer header
        'Referer': 'https://asuracomic.net/' 
      }
    });

    // Send the correct content type header
    res.setHeader('Content-Type', response.headers['content-type']);

    // "Pipe" the image data from the source directly to the client
    response.data.pipe(res);

  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).send('Failed to fetch image');
  }
});
app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
