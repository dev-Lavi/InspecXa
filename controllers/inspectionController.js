const ICInspection = require('../models/ICInspection');
const OEMReference = require('../models/OEMReference');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
// Assume a scraper utility that fetches OEM marking details given an IC part number
const scraper = require('../utils/scraper'); // implement this module separately

// Configuration for ML verification endpoint
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://ml-server/verify';

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
  const { inspectionId } = req.body;
  try {
    const inspection = await ICInspection.findById(inspectionId);
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

    // Build the correct local path for this IC's datasheet PDF
    const pdfPath = path.resolve('pdf-database', `${inspection.icPartNumber}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'OEM PDF not found for this IC.' });
    }

    const scraped = await scraper.extractPartMarkingsFromPDF(pdfPath, inspection.icPartNumber);
    if (!scraped.markingOptions.length) {
      return res.status(404).json({ error: 'No device marking found in PDF.' });
    }

    const mlPayload = {
      imageUrl: inspection.imageUrl,
      extractedMarking: inspection.extractedMarking,
      oemMarkingOptions: scraped.markingOptions
    };

    const mlResponse = await axios.post(ML_SERVER_URL, mlPayload);
    res.json({ mlResponse: mlResponse.data, inspection, oemReference: scraped });
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
