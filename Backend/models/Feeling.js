const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const feelingSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  role: { type: String, enum: ["child", "parent"], required: true },
  likesCount: { type: Number, default: 0 },
  liked: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  comments: [commentSchema]
});

module.exports = mongoose.model("Feeling", feelingSchema);
