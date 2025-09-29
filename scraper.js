const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require('puppeteer-extra'); 
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// --- Site-Specific Function for AsuraScans Series ---
// Renamed from scrapeSeriesPage to be more specific
async function scrapeAsuraSeries(seriesUrl) {
  try {
    console.log(`Using AsuraScans series scraper for: ${seriesUrl}`);
    const { data } = await axios.get(seriesUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);

    const seriesTitle = $("span.text-xl.font-bold").text().trim();
    const coverImageUrl = $('img[alt="poster"]').attr("src");
    const chapters = [];

    $("div.pl-4.pr-2.pb-4.overflow-y-auto a").each((_, element) => {
      const linkElement = $(element);
      const relativeUrl = linkElement.attr("href");
      // CORRECTED: The base URL should be the root domain.
      const chapterUrl = new URL(relativeUrl, "https://asuracomic.net/").href; 
      const chapterNumberAndTitle = linkElement.find("h3").first().text().replace("Chapter", "").trim();
      const chapterDate = linkElement.find("h3").last().text().trim();
      chapters.push({ number: chapterNumberAndTitle, url: chapterUrl, date: chapterDate });
    });

    chapters.reverse();
    return { title: seriesTitle, cover: coverImageUrl, chapters: chapters };
  } catch (error) {
    console.error(`Error during series scraping: ${error.message}`);
    return null;
  }
}

// --- Site-Specific Function for AsuraScans Chapter Images ---
// Renamed from scrapeChapterImages
// In scraper.js

async function scrapeAsuraChapterImages(chapterUrl) {
    console.log(`Using NEW AsuraScans chapter scraper for: ${chapterUrl}`);
    try {
        // 1. Fetch the page HTML quickly with axios
        const { data: html } = await axios.get(chapterUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        // 2. Find the script tag containing the page data using a regex
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (!match || !match[1]) {
            throw new Error("Could not find __NEXT_DATA__ script tag.");
        }

        // 3. Parse the JSON data
        const jsonData = JSON.parse(match[1]);

        // 4. Navigate through the complex JSON object to find the image URLs
        const pages = jsonData.props.pageProps.chapter.pages;
        const imageUrls = pages.map(page => page.url);
        
        if (!imageUrls || imageUrls.length === 0) {
            throw new Error('Image list was found but was empty.');
        }

        console.log(`Found ${imageUrls.length} images.`);
        return imageUrls;

    } catch (error) {
        console.error(`Error scraping AsuraScans chapter: ${error.message}`);
        return [];
    }
}

// In scraper.js


async function scrapeArcaneSeries(seriesUrl) {
  console.log(`Using ArcaneScans series scraper for: ${seriesUrl}`);
  try {
    const { data } = await axios.get(seriesUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);

    const title = $('h1.entry-title').text().trim();
    const cover = $('.thumb img').attr('src');
    
    const chaptersList = [];
    $('.eplister ul li').each((_, element) => {
      const linkTag = $(element).find('a');
      const dateTag = $(element).find('.chapterdate');
      
      chaptersList.push({
        url: linkTag.attr('href'),
        number: linkTag.find('.chapternum').text().replace('Chapter', '').trim(),
        date: dateTag.text().trim(),
      });
    });

    // Arcane Scans lists newest first, so we don't need to reverse.
    return { title, cover, chapters: chaptersList };
  } catch (error) {
    console.error(`Error scraping ArcaneScans series: ${error.message}`);
    return null;
  }
}

// In scraper.js

// In scraper.js

async function scrapeArcaneChapterImages(chapterUrl) {
  console.log(`Using ArcaneScans chapter scraper for: ${chapterUrl}`);
  try {
    const { data: html } = await axios.get(chapterUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    // Find the script tag that contains the image data
    const match = html.match(/ts_reader.run\((.*?)\);/);
    if (!match || !match[1]) {
      throw new Error("Could not find ts_reader data script tag.");
    }

    // The data is a JavaScript object, not perfect JSON, so we need to parse it carefully
    const scriptData = match[1];
    // Use another regex to find the 'images' array within the object string
    const imagesMatch = scriptData.match(/"images":(\[".*?"\])/);
    
    if (!imagesMatch || !imagesMatch[1]) {
      throw new Error("Could not find the images array within the script data.");
    }
    
    // Parse the found array string into a real JavaScript array
    const imageUrls = JSON.parse(imagesMatch[1]);
    return imageUrls;

  } catch (error) {
    console.error(`Error scraping ArcaneScans chapter: ${error.message}`);
    return [];
  }
}


// --- NEW "MASTER" FUNCTIONS ---

/**
 * Checks the URL and calls the correct site-specific scraper for a SERIES page.
 * @param {string} url The URL of the series to scrape.
 */
async function scrapeSeriesPage(url) {
  if (url.includes('asuracomic.net')) {
    return await scrapeAsuraSeries(url);
  } else if (url.includes('arcanescans.com') ) {
    return await scrapeArcaneSeries(url);
  } else {
    throw new Error("Unsupported website for series scraping.");
  }
}

/**
 * Checks the URL and calls the correct site-specific scraper for a CHAPTER page.
 * @param {string} url The URL of the chapter to scrape.
 */
async function scrapeChapterImages(url) {
  if (url.includes('asuracomic.net')) {
    return await scrapeAsuraChapterImages(url);
  } else if (url.includes('arcanescans.com')) {
    return await scrapeArcaneChapterImages(url);
  } else {
    throw new Error("Unsupported website for chapter scraping.");
  }
}

module.exports = {
  scrapeSeriesPage,
  scrapeChapterImages,
};
