const express = require("express");
const mongoose = require("mongoose");
const { type } = require("os");

const Chapter = new mongoose.Schema({
  chapter_number: String,
  title: String,
  source_url: String,
  release_date: Date,
  images: [String], // URLs or file paths
  read_status: { type: Boolean, default: false },
});

const Series = mongoose.model(
  "Series",
  new mongoose.Schema({
    title: { type: String, required: true },
    source_url: { type: String, required: true },
    cover_url: String,
    status: { type: String, enum: ["reading", "finished"], default: "reading" },
    chapters: [Chapter],
    last_read:{type:String,default:"0"},
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  })
);

module.exports = { Series };
