const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  name: { type: String, required: true },
  graduation: [{ type: String, required: true }],
  interviewDate: { type: Date, required: true },
  feedback: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Analysis', analysisSchema);