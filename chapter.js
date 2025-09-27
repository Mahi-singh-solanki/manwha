const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Series } = require("./model");
const { scrapeChapterImages } = require("./scraper");

router.get("/series/:id/chapters", async (req, res) => {
  try {
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ error: "Series not found" });
    res.json(series.chapters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server connection error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const series = await Series.findOne({ "chapters._id": req.params.id });
    if (!series) return res.status(404).json({ error: "Chapter not found" });

    const chapter = series.chapters.id(req.params.id);

    // 2. CHECK if images already exist in the database.
    if (chapter.images && chapter.images.length > 0) {
      console.log("Serving chapter images from database.");
      return res.json(chapter); // If they exist, return them immediately.
    }

    // 3. If images array is empty, SCRAPE them.
    console.log("Images not found in DB, scraping from web...");
    const imageUrls = await scrapeChapterImages(chapter.source_url);

    // 4. SAVE the new image URLs back to the database.
    chapter.images = imageUrls;
    await series.save();

    console.log(
      `Saved ${imageUrls.length} images for chapter: ${chapter.chapter_number}`
    );

    // 5. RETURN the full chapter object, now including the images.
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const { read_status } = req.body;
    const series = await Series.findOne({ "chapters._id": req.params.id });
    if (!series) return res.status(404).json({ error: "Chapter not found" });

    const chapter = series.chapters.id(req.params.id);
    chapter.read_status = read_status;
    await series.save();

    res.json({ message: "Chapter updated", chapter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router };
