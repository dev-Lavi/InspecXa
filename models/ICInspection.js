const mongoose = require('mongoose');

const MLDetectionSchema = new mongoose.Schema({
  bbox: [Number],            // bounding box [x1, y1, x2, y2]
  text: String,              // OCR/result text
  font: String,
  confidence: Number
}, { _id: false });

const ICInspectionSchema = new mongoose.Schema({
  icPartNumber: { type: String },        // optional if not provided
  imageUrl: { type: String, required: true },   // original upload URL (local or cloud)
  extractedMarking: { type: String },    // optional: ML/ocr marking
  verified: { type: Boolean },           // after analysis
  isGenuine: { type: Boolean },          // result from process
  batchId: { type: String },
  result: { type: String },              // summary or tag: 'genuine', 'fake', etc.
  // --- NEW FIELDS ----
  detections: [MLDetectionSchema],       // all text/box results
  numBoxes: { type: Number },            // from ML detection
  annotatedImagePath: { type: String },  // server path
  annotatedImageUrl: { type: String },   // public URL
  mlProcessingTime: { type: Number },    // inference time (seconds)
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ICInspection', ICInspectionSchema);
