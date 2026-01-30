const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const parentRoutes = require("./routes/parent");
const childRoutes = require("./routes/child");
const analysisRoutes = require("./routes/analysis");
const feelingsRoutes = require("./routes/feelings");

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");

// === SOCKET.IO SETUP ===
let CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
// Support multiple origins for development
if (process.env.NODE_ENV === 'development') {
  CORS_ORIGIN = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:4001"
  ];
}
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// MIDDLEWARE 
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:3000",
    "http://localhost:4001"
  ] : [process.env.CORS_ORIGIN || "http://localhost:5173"]
}));
app.use(express.json());

//  ROUTES 
app.use("/parent", parentRoutes);
app.use("/child", childRoutes);
app.use("/analysis", analysisRoutes);
app.use("/feelings", feelingsRoutes);

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

// Import Feeling model for socket operations
const Feeling = require("./models/Feeling");

// SOCKET.IO EVENTS
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When a new feeling is posted from frontend
  socket.on("newFeeling", async (data) => {
    try {
      console.log("New Feeling Received:", data);
      
      // Save to database
      const newFeeling = new Feeling({
        text: data.text,
        author: data.author,
        authorRole: data.authorRole,
        likes: [],
        comments: []
      });
      
      await newFeeling.save();
      
      // Broadcast to all users including sender
      const feelingObj = newFeeling.toObject();
      io.emit("receiveFeeling", {
        ...feelingObj,
        likesCount: feelingObj.likes ? feelingObj.likes.length : 0
      });
      
      console.log("Feeling saved and broadcasted");
    } catch (error) {
      console.error("Error saving feeling:", error);
      socket.emit("error", { message: "Failed to save feeling" });
    }
  });

  // Handle like toggle
  socket.on("toggleLike", async (data) => {
    try {
      const { feelingId, userId, userRole } = data;
      
      const feeling = await Feeling.findById(feelingId);
      if (!feeling) {
        socket.emit("error", { message: "Feeling not found" });
        return;
      }

      const wasLiked = feeling.toggleLike(userId, userRole);
      await feeling.save();

      // Broadcast like update to all users
      io.emit("likeUpdated", {
        feelingId,
        wasLiked,
        likesCount: feeling.likesCount,
        userId
      });
      
      console.log(`Like toggled for feeling ${feelingId}: ${wasLiked ? 'liked' : 'unliked'}`);
    } catch (error) {
      console.error("Error toggling like:", error);
      socket.emit("error", { message: "Failed to toggle like" });
    }
  });

  // Handle new comment
  socket.on("newComment", async (data) => {
    try {
      const { feelingId, text, author, authorRole } = data;
      
      const feeling = await Feeling.findById(feelingId);
      if (!feeling) {
        socket.emit("error", { message: "Feeling not found" });
        return;
      }

      const newComment = {
        text,
        author,
        authorRole,
        timestamp: new Date()
      };

      feeling.comments.push(newComment);
      await feeling.save();

      // Broadcast comment to all users
      io.emit("commentAdded", {
        feelingId,
        comment: newComment
      });
      
      console.log(`Comment added to feeling ${feelingId} by ${author}`);
    } catch (error) {
      console.error("Error adding comment:", error);
      socket.emit("error", { message: "Failed to add comment" });
    }
  });

  // Handle user joining a room (for future features)
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Handle user leaving a room
  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room: ${room}`);
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