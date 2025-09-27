// scraper.js

const axios = require("axios");
const cheerio = require("cheerio");
// <-- ADD THIS
const puppeteer = require('puppeteer-extra'); 

// 2. Add the Stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
// ... (Your scrapeSeriesPage function can stay the same) ...

// In scraper.js
// ... requires at the top ...

// In scraper.js

// In scraper.js

async function scrapeChapterImages(chapterUrl) {
  let browser = null;
  let page = null;
  try {
    console.log(`Launching browser to fetch images from ${chapterUrl}...`);
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable',
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
    page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    );
    await page.goto(chapterUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    
    // Using a delay to ensure all scripts have loaded
    console.log('Waiting for page scripts to finish...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // --- FINAL FIX: Using the correct selector based on your findings ---
    const imageSelector = 'img[alt^="chapter page"]';
    console.log(`Now waiting for the image selector: "${imageSelector}"`);
    await page.waitForSelector(imageSelector, { timeout: 60000 });

    const imageUrls = await page.evaluate((selector) => {
      // This script runs inside the browser
      const images = Array.from(document.querySelectorAll(selector));
      return images.map(img => img.src);
    }, imageSelector); // Pass the selector into the evaluate function
    // -----------------------------------------------------------------

    console.log(`Found ${imageUrls.length} images.`);
    return imageUrls;

  } catch (error) {
    console.error(`Error fetching images with Puppeteer: ${error.message}`);
    if (page) {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('Saved an error-screenshot.png to help debug.');
    }
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
// ... your other functions and module.exports

async function scrapeSeriesPage(seriesUrl) {
  // ... same code as before ...
  try {
    console.log(`Fetching series data from ${seriesUrl}...`);

    const { data } = await axios.get(seriesUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    const seriesTitle = $("span.text-xl.font-bold").text().trim();
    const coverImageUrl = $('img[alt="poster"]').attr("src");

    console.log(`Scraping details for: "${seriesTitle}"`);

    const chapters = [];
    $("div.pl-4.pr-2.pb-4.overflow-y-auto a").each((index, element) => {
      const linkElement = $(element);
      const relativeUrl = linkElement.attr("href");
      const chapterUrl = new URL(relativeUrl, "https://asuracomic.net/series/").href; // This URL is already absolute
      const chapterNumberAndTitle = linkElement
        .find("h3")
        .first()
        .text()
        .replace("Chapter", "")
        .trim();
      const chapterDate = linkElement.find("h3").last().text().trim();

      chapters.push({
        number: chapterNumberAndTitle,
        url: chapterUrl,
        date: chapterDate,
      });
    });

    chapters.reverse();

    return {
      title: seriesTitle,
      cover: coverImageUrl,
      chapters: chapters,
    };
  } catch (error) {
    console.error(`Error during series scraping: ${error.message}`);
    return null;
  }
}

// --- NEW AND IMPROVED FUNCTION FOR SCRAPING IMAGES ---
// In scraper.js



module.exports = {
  scrapeSeriesPage,
  scrapeChapterImages,
};
