const express = require("express");
console.log("NEW INDEX.JS LOADED");

const http = require("http");
const { Server } = require("socket.io");

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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("join-room", (room) => {
  socket.join(room);
  console.log(`${socket.id} joined room: ${room}`);
});
  socket.on("chat-message", ({ username, message, room }) => {
  console.log(`${username}: ${message} | Room: ${room}`);

  io.to(room).emit("chat-message", {
    username,
    message,
  });
});

  socket.on("join-room", (room) => {
  if (socket.currentRoom) {
    socket.leave(socket.currentRoom);
  }

  socket.join(room);
  socket.currentRoom = room;

  console.log(`${socket.id} joined room: ${room}`);
});

  

  socket.on("typing", ({ username }) => {
  socket.broadcast.emit("typing", { username });
});

socket.on("stop-typing", () => {
  socket.broadcast.emit("stop-typing");
});

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});