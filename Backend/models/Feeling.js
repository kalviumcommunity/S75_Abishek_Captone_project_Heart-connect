const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  authorRole: { type: String, enum: ["child", "parent"], required: true },
  timestamp: { type: Date, default: Date.now }
});

const likeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userRole: { type: String, enum: ["child", "parent"], required: true },
  timestamp: { type: Date, default: Date.now }
});

const feelingSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  authorRole: { type: String, enum: ["child", "parent"], required: true },
  likes: [likeSchema],
  comments: [commentSchema],
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Virtual for likes count
feelingSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for checking if a specific user liked this feeling
feelingSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.userId === userId);
};

// Method to toggle like
feelingSchema.methods.toggleLike = function(userId, userRole) {
  const existingLikeIndex = this.likes.findIndex(like => like.userId === userId);
  
  if (existingLikeIndex > -1) {
    // Remove like
    this.likes.splice(existingLikeIndex, 1);
    return false; // Like removed
  } else {
    // Add like
    this.likes.push({ userId, userRole });
    return true; // Like added
  }
};

module.exports = mongoose.model("Feeling", feelingSchema);
