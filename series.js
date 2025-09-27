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

router.delete("/:id", async (req, res) => {
  try {
    await Series.findByIdAndDelete(req.params.id);
    res.json({ message: "Series deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server connection error" });
  }
});

router.get("/:id/refresh", async (req, res) => {
  try {
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ error: "Not found" });

    res.json({ message: "Scraper triggered for this series" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server connection error" });
  }
});

module.exports = { router };
