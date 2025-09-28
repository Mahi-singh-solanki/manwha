const express = require("express");
const mongoose = require("mongoose");
const body_parser = require("body-parser");
const cors = require('cors'); // 1. Import the cors package


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

app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
