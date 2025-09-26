const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const parentRoutes = require("./routes/parent");
const childRoutes = require("./routes/child");
const analysisRoutes = require("./routes/analysis");

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");

// === SOCKET.IO SETUP ===
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// MIDDLEWARE 
app.use(cors());
app.use(express.json());

//  ROUTES 
app.use("/parent", parentRoutes);
app.use("/child", childRoutes);
app.use("/analysis", analysisRoutes);

//MONGO CONNECTION 
const uri = process.env.MONGODB_URI || process.env.uri;
if (!uri) {
  console.error("MongoDB URI not provided. Set MONGODB_URI in Backend/.env");
  process.exit(1);
}
mongoose.connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// SOCKET.IO EVENTS
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When a new feeling is posted from frontend
  socket.on("newFeeling", (data) => {
    console.log("New Feeling Received:", data);
    // Broadcast it to all other users
    socket.broadcast.emit("receiveFeeling", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// === START SERVER ===
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});