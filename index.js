const express = require("express");
const mongoose = require("mongoose");
const body_parser = require("body-parser");
const cors = require('cors'); // 1. Import the cors package
const axios = require("axios");
const PROXY_HOST = process.env.WS_PROXY_HOST;
const PROXY_PORT = process.env.WS_PROXY_PORT;
const PROXY_USER = process.env.WS_PROXY_USER;
const PROXY_PASS = process.env.WS_PROXY_PASS;

const app = express();
app.use(body_parser.json());
const corsOptions = {
  origin:"https://mahi-manwha.netlify.app",
  origin:"http://localhost:5173" // Only allow requests from your frontend URL
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

        let refererDomain = '';

        // --- DYNAMIC REFERER LOGIC ---
        if (imageUrl.includes('asuracomic.net')) {
            // Use the root domain for Asura
            refererDomain = 'https://asuracomic.net';
        } else if (imageUrl.includes('arcanescans.org')) {
            // Use the root domain for ArcaneScans
            refererDomain = 'https://arcanescans.org';
        } else if (imageUrl.includes('kingofshojo.com')) {
            // Use the root domain for KingOfShojo
            refererDomain = 'https://kingofshojo.com';
        } else if (imageUrl.includes('hivetoons.org') || imageUrl.includes('hivetoon.com')) {
            // Use the root domain for Hivetoons (handles both subdomains/typos)
            refererDomain = 'https://hivetoons.org';
        } else if (imageUrl.includes('manhuaplus.com')) {
            // Use the root domain for ManhuaPlus
            refererDomain = 'https://manhuaplus.com';
        } 
        // Note: For generic image hosts like Imgur or external CDNs, 
        // leaving the Referer empty or setting it to your own domain might be necessary.
        // For security purposes, we'll only set it for known scraped sites.
        // --- END DYNAMIC REFERER LOGIC ---
const proxyConfig = {
            // Webshare often uses HTTP or SOCKS5 (check your Webshare settings)
            protocol: 'http', 
            host: PROXY_HOST,
            port: parseInt(PROXY_PORT), // Ensure port is an integer
            auth: {
                username: PROXY_USER,
                password: PROXY_PASS,
            },
        };
        const response = await axios({
    method: 'get',
    url: imageUrl,
    responseType: 'stream',
    proxy: proxyConfig,
    headers: {
        'Referer': refererDomain, 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        
        // --- ADD THESE TWO HEADERS ---
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br', // Essential for modern browser disguise
    }
});
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
