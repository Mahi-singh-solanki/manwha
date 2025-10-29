const axios = require("axios");
const cheerio = require("cheerio");
const chromiumBinary = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

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
      const chapterUrl = new URL(relativeUrl, "https://asuracomic.net/series/").href;
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

  let browser = null;

  let page = null;

  try {

    console.log(`Using AsuraScans chapter scraper for: ${chapterUrl}...`);

    browser = await puppeteer.launch({

      executablePath: '/usr/bin/chromium',

      headless: "new",

      args: [...chromiumBinary.args,'--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu','--disable-dev-shm-usage', // Critical
        '--disable-blink-features=AutomationControlled',],

    });

    page = await browser.newPage();

    await page.setUserAgent(

      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'

    );



    await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });



    await page.keyboard.press('Escape'); // close popups

    await new Promise(r => setTimeout(r, 2000));



    await fullAutoScroll(page);



    // Grab both src and data-src

    const imageUrls = await page.evaluate(() => {

      return Array.from(document.querySelectorAll("img"))

        .map(img => img.getAttribute("src") || img.getAttribute("data-src"))

        .filter(src => src && src.includes("https://gg.asuracomic.net/storage/media"));

    });



    console.log(`Found ${imageUrls.length} images.`);

    return imageUrls;

  } catch (error) {

    console.error(`Error fetching images with Puppeteer: ${error.message}`);

    if (page) await page.screenshot({ path: 'error-screenshot.png', fullPage: true });

    return [];

  } finally {

    if (browser) await browser.close();

  }

}



async function fullAutoScroll(page) {

  let prevHeight = 0;

  while (true) {

    const currentHeight = await page.evaluate('document.body.scrollHeight');

    if (currentHeight === prevHeight) break; // stop when no more new content

    prevHeight = currentHeight;

    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

    await new Promise(r => setTimeout(r, 1500));

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
async function scrapeKingofshojoSeries(seriesUrl) {
  console.log(`Using Kingofshojo series scraper for: ${seriesUrl}`);
  try {
    const { data } = await axios.get(seriesUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);

    const title = $('h1.entry-title').text().trim();
    const cover = $('.thumb img').attr('src');
    
    const chaptersList = [];
    // Find all list items in the chapter list container
    $('.eplister ul li').each((_, element) => {
      const linkTag = $(element).find('a');
      const dateTag = $(element).find('.chapterdate');
      
      chaptersList.push({
        url: linkTag.attr('href'),
        number: linkTag.find('.chapternum').text().replace('Chapter', '').trim(),
        date: dateTag.text().trim(),
      });
    });

    // This site lists newest first, so we reverse it to get chronological order
    chaptersList.reverse();
    
    return { title, cover, chapters: chaptersList };
  } catch (error) {
    console.error(`Error scraping Kingofshojo series: ${error.message}`);
    return null;
  }
}
// In scraper.js, add this new function

async function scrapeKingofshojoChapterImages(chapterUrl) {
  console.log(`Using Kingofshojo chapter scraper for: ${chapterUrl}`);
  try {
    const { data } = await axios.get(chapterUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);

    const imageUrls = [];
    
    // Find all images inside the main reading container with the ID #readerarea
    $('#readerarea img').each((_, element) => {
      const imageUrl = $(element).attr('src');
      if (imageUrl) {
        imageUrls.push(imageUrl.trim());
      }
    });

    if (imageUrls.length === 0) {
        console.log("No images found with the primary selector. Trying fallback...");
        // Fallback for pages that might use a script to store image data
        const scriptContent = $('script:contains("ts_reader.run")').html();
        if (scriptContent) {
            const match = scriptContent.match(/"images":(\[".*?"\])/);
            if (match && match[1]) {
                const parsedUrls = JSON.parse(match[1]);
                imageUrls.push(...parsedUrls);
            }
        }
    }

    if(imageUrls.length === 0){
        throw new Error("Could not find any images on the page.");
    }
    
    console.log(`Found ${imageUrls.length} images.`);
    return imageUrls;
  } catch (error) {
    console.error(`Error scraping Kingofshojo chapter: ${error.message}`);
    return [];
  }
}

/**
 * Checks the URL and calls the correct site-specific scraper for a SERIES page.
 * @param {string} url The URL of the series to scrape.
 */
async function scrapeSeriesPage(url) {
  if (url.includes('asuracomic.net')) {
    return await scrapeAsuraSeries(url);
  } else if (url.includes('arcanescans.org')) {
    return await scrapeArcaneSeries(url);
  }else if (url.includes('kingofshojo.com')) {
    return await scrapeKingofshojoSeries(url);}
   else {
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
  } else if (url.includes('arcanescans.org')) {
    return await scrapeArcaneChapterImages(url);
  }else if (url.includes('kingofshojo.com')) {
    return await scrapeKingofshojoChapterImages(url);} 
  else {
    throw new Error("Unsupported website for chapter scraping.");
  }
}

module.exports = {
  scrapeSeriesPage,
  scrapeChapterImages,
};
