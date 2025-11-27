const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { Series } = require("./model");
const { scrapeSeriesPage } = require("./scraper");

// In series.js

router.post("/", async (req, res) => {
  try {
    // ... (code to get source_url and run the scraper) ...
    const { source_url } = req.body;
    const scrapedData = await scrapeSeriesPage(source_url);
    // ...

    const newSeries = new Series({
      title: scrapedData.title,
      source_url: source_url,
      cover_url: scrapedData.cover,
      chapters: scrapedData.chapters.map((ch) => {
        // --- FIX IS HERE ---
        // 1. Clean the date string by removing suffixes
        const cleanDateString = ch.date.replace(/\b(st|nd|rd|th)\b/g, "");

        // 2. Create the date object from the clean string
        const parsedDate = new Date(cleanDateString);

        return {
          chapter_number: ch.number,
          source_url: ch.url,
          // 3. Use the valid date, or a fallback if it's still invalid
          release_date: !isNaN(parsedDate) ? parsedDate : new Date(),
        };
      }),
    });

    await newSeries.save();
    res.status(201).json(newSeries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during series creation." });
  }
});

// ... rest of the file

router.get("/", async (req, res) => {
  try {
    const serieslist = await Series.find();
    res.json(serieslist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server connection error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ error: "Not found" });
    res.json(series);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server connection error" });
  }
});

router.put("/last/:id",async(req,res)=>{
  try{
    const {last_read}=req.body;
    if (last_read === undefined) {
      return res.status(400).json({ error: "last_read value is required" });
    }
    const series = await Series.findById(req.params.id);
    series.last_read=last_read;
    await series.save()
    res.status(200).json({ message: `Last read ${last_read} `});
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Server connection error" });
  }
})

router.delete("/:id", async (req, res) => {
  try {
    await Series.findByIdAndDelete(req.params.id);
    res.json({ message: "Series deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server connection error" });
  }
});
// In backend/series.js

// This is only the refresh route. Add it to your existing series.js file.

// In backend/series.js

// In backend/series.js

// Add this new route to the file
// In backend/series.js

router.post("/refresh-all", async (req, res) => {
  console.log('[MANUAL-REFRESH] Starting full library refresh job...');
  res.json({ message: "Refresh process started on the server." });

  (async () => {
    const allSeries = await Series.find();
    console.log(`[MANUAL-REFRESH] Found ${allSeries.length} series to check.`);
    
    for (const series of allSeries) {
      try {
        const scrapedData = await scrapeSeriesPage(series.source_url);
        if (!scrapedData) continue;

        const seriesToUpdate = await Series.findById(series._id);

        // --- THE FIX IS HERE ---
        // 1. Create a Set of existing chapter NUMBERS for fast lookups.
        // We convert to String to ensure a reliable comparison (e.g., '101' vs 101).
        const existingChapterNumbers = new Set(
          seriesToUpdate.chapters.map(ch => String(ch.chapter_number))
        );

        // 2. Filter the newly scraped chapters by checking if their 'number'
        // is already in our Set of existing chapter numbers.
        const newChapters = scrapedData.chapters.filter(ch => 
          !existingChapterNumbers.has(String(ch.number))
        );
        // -----------------------

        if (newChapters.length > 0) {
          const formattedNewChapters = newChapters.map(ch => ({
            chapter_number: ch.number, // Make sure scraped 'number' maps to 'chapter_number'
            source_url: ch.url,
            release_date: new Date(),
          }));
          seriesToUpdate.chapters.unshift(...formattedNewChapters);
          await seriesToUpdate.save();
          console.log(`[MANUAL-REFRESH] Added ${newChapters.length} new chapters to ${series.title}.`);
        }
      } catch (error) {
        console.error(`[MANUAL-REFRESH] Failed to refresh ${series.title}:`, error.message);
      }
      // A delay to avoid getting blocked by the source site
      await new Promise(resolve => setTimeout(resolve, 30000)); 
    }
    console.log(`[MANUAL-REFRESH] Job finished.`);
  })();
});
module.exports = { router };
