const path = require('path');
const fs = require('fs');
const OEMReference = require('../models/OEMReference');

// Build local PDF path for a part number
function getPdfPath(icPartNumber) {
  return path.resolve('pdf-database', `${icPartNumber}.pdf`);
}

// Upload/replace PDF for a part
exports.uploadOemPdf = async (req, res) => {
  const { icPartNumber, description } = req.body;
  if (!icPartNumber || !req.file) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'icPartNumber (text) and pdfFile (file) are required.' });
  }
  try {
    const dbDir = path.resolve('pdf-database');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
    const targetPath = getPdfPath(icPartNumber);
    fs.renameSync(req.file.path, targetPath);

    await OEMReference.findOneAndUpdate(
      { icPartNumber },
      { datasheetUrl: targetPath, description, lastUpdated: new Date() }, // store description
      { upsert: true }
    );
    res.json({
      success: true,
      message: `PDF uploaded for ${icPartNumber}`,
      pdfFile: targetPath
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Get/download the OEM PDF for given part number
exports.downloadOemPdf = async (req, res) => {
  const icPartNumber = req.params.icPartNumber;
  const pdfPath = getPdfPath(icPartNumber);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'No OEM PDF found for this part.' });
  }
  res.download(pdfPath, `${icPartNumber}.pdf`);
};

// Delete the OEM PDF for a part number
exports.deleteOemPdf = async (req, res) => {
  const icPartNumber = req.params.icPartNumber;
  const pdfPath = getPdfPath(icPartNumber);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'No OEM PDF found to delete.' });
  }
  try {
    fs.unlinkSync(pdfPath);
    // Optionally clear the datasheetUrl from the OEMReference entry:
    await OEMReference.findOneAndUpdate(
      { icPartNumber },
      { $unset: { datasheetUrl: '', lastUpdated: '' } }
    );
    res.json({ success: true, message: `OEM PDF deleted for ${icPartNumber}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
