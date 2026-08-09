const express = require("express");
console.log("NEW INDEX.JS LOADED");

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const cors = require("cors");
const Data = require("./models/Data");

const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    console.log("Database:", mongoose.connection.name);
    console.log("Collection:", Data.collection.name);
  })
  .catch((err) => console.log(err));

  app.get("/", (req, res) => {
  res.send("MongoDB Connected Successfully");
});
app.get("/api/data", async (req, res) => {
  try {
    const data = await Data.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching data",
    });
  }
});
app.post("/api/data", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "sprint11" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );

        stream.end(req.file.buffer);
      });
    }

    const newData = new Data({
      title: req.body.title,
      status: req.body.status,
      image: imageUrl,
    });

    await newData.save();

    res.status(201).json(newData);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error saving data",
      error: error.message,
    });
  }
});
app.delete("/api/data/:id", async (req, res) => {
  try {
    const deletedData = await Data.findByIdAndDelete(req.params.id);

    res.json({
      message: "Data deleted successfully",
      deletedData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting data",
      error: error.message,
    });
  }
});

app.listen(process.env.PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${process.env.PORT}`);
});