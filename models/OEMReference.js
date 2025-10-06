const mongoose = require('mongoose');
const OEMReferenceSchema = new mongoose.Schema({
  icPartNumber: { type: String, required: true, unique: true },
  markingDetails: { type: String },
  description: { type: String }, // <-- ADD THIS LINE
  datasheetUrl: { type: String },
  lastUpdated: { type: Date, default: Date.now }
});
module.exports = mongoose.model('OEMReference', OEMReferenceSchema);
