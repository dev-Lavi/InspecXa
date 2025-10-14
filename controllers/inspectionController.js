const ICInspection = require('../models/ICInspection');
const OEMReference = require('../models/OEMReference');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
// Assume a scraper utility that fetches OEM marking details given an IC part number
const scraper = require('../utils/scraper'); // implement this module separately

// Configuration for ML verification endpoint
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'https://ocr-ic-display.onrender.com/upload_image';

// Upload IC image
exports.upload = async (req, res) => {
  const { icPartNumber } = req.body;
  try {
    const inspection = new ICInspection({
      icPartNumber,
      imageUrl: req.file.path,
    });
    await inspection.save();
    res.json({ success: true, inspection });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Process OCR and save extracted marking
exports.process = async (req, res) => {
  const { inspectionId, extractedMarking } = req.body;
  try {
    const inspection = await ICInspection.findByIdAndUpdate(
      inspectionId,
      { extractedMarking },
      { new: true }
    );
    res.json({ success: true, inspection });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send image, extracted marking, and OEM details to ML server for verification

// ...
exports.sendForMLVerification = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No IC image uploaded.' });

    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path));

    // Send image to ML server
    const mlResponseRaw = await axios.post(
      'https://ocr-ic-display.onrender.com/upload_image',
      form,
      { headers: form.getHeaders() }
    );

    const mlDetections = mlResponseRaw.data.detections;
    const annotatedPath = mlDetections.annotated_image_path || mlResponseRaw.data.annotated_image_url;
    const publicAnnotatedUrl = `https://ocr-ic-display.onrender.com${annotatedPath}`;

    // Choose text from the first detection with highest confidence as extractedMarking (fallback: "")
    const mainMark = (mlDetections.detections || [])
      .filter(d => d.text && d.confidence)
      .sort((a, b) => b.confidence - a.confidence)[0]?.text || "";

    // Optional: Genuine/fake decision from ML or business logic
    // For demo, mark as genuine if any OCR text matches your OEM database or a simple heuristic:
    const isGenuine = mainMark === "YOUR_EXPECTED_MARKING"; // Replace with your matching logic.

    // Save to DB
    const dbObj = await ICInspection.create({
      imageUrl: req.file.path,
      extractedMarking: mainMark,
      verified: true,
      isGenuine,
      detections: mlDetections.detections,
      numBoxes: mlDetections.num_boxes,
      annotatedImagePath: annotatedPath,
      annotatedImageUrl: publicAnnotatedUrl,
      mlProcessingTime: mlDetections.processing_time,
      result: isGenuine ? "genuine" : "fake"
    });

    res.json({
      success: true,
      inspection: dbObj,
      mlResponse: mlDetections,
      annotated_image_url: publicAnnotatedUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// Generate report based on icPartNumber
exports.report = async (req, res) => {
  try {
    const filter = req.query.icPartNumber ? { icPartNumber: req.query.icPartNumber } : {};
    const inspections = await ICInspection.find(filter);
    res.json({ inspections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
