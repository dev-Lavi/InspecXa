const mongoose = require('mongoose');
const ICInspectionSchema = new mongoose.Schema({
  icPartNumber: { type: String, required: true },
  imageUrl: { type: String, required: true },
  extractedMarking: { type: String },
  verified: { type: Boolean },
  isGenuine: { type: Boolean },
  batchId: { type: String },
  result: { type: String },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('ICInspection', ICInspectionSchema);
