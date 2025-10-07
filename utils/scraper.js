const fs = require('fs');
const path = require('path');
const PdfReader = require('pdfreader').PdfReader;

async function extractPartMarkingsFromPDF(pdfPath, icPartNumber) {
  const absPath = path.isAbsolute(pdfPath) ? pdfPath : path.resolve(pdfPath);

  if (!fs.existsSync(absPath)) {
    console.log('[Scraper DEBUG] PDF does not exist:', absPath);
    return { icPartNumber, markingOptions: [], pdfPath: absPath };
  }

  console.log('[Scraper DEBUG] Reading PDF via pdfreader:', absPath);

  const rows = {}; // store text by Y-coordinate (row)
  const pdfReader = new PdfReader();

  await new Promise((resolve, reject) => {
    pdfReader.parseFileItems(absPath, (err, item) => {
      if (err) return reject(err);
      if (!item) return resolve(); // end of file
      if (item.text) {
        const y = item.y.toFixed(1);
        rows[y] = (rows[y] || []).concat(item.text.trim());
      }
    });
  });

  // Convert rows object -> array of text lines
  const lines = Object.keys(rows)
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .map(y => rows[y].join(' ').replace(/\s{2,}/g, ' ').trim());

  console.log('[Scraper DEBUG] Total extracted lines:', lines.length);

  // Find the PACKAGING INFORMATION section
  const packagingIdx = lines.findIndex(line =>
    line.toUpperCase().includes('PACKAGING INFORMATION')
  );

  if (packagingIdx === -1) {
    console.log('[Scraper DEBUG] PACKAGING INFORMATION section not found.');
    return { icPartNumber, markingOptions: [], pdfPath: absPath };
  }

  console.log('[Scraper DEBUG] Found PACKAGING INFORMATION at line:', packagingIdx);
  const section = lines.slice(packagingIdx, packagingIdx + 120); // take next 120 lines
  const partBase = icPartNumber.match(/[A-Za-z]+\d+/i)
    ? icPartNumber.match(/[A-Za-z]+\d+/i)[0]
    : icPartNumber;

  // Find rows that contain the part number (case-insensitive)
  const relevantRows = section.filter(line =>
    line.toUpperCase().includes(partBase.toUpperCase())
  );

  console.log('[Scraper DEBUG] Matched rows:', relevantRows.length);
  relevantRows.forEach((r, i) => console.log(`[ROW ${i + 1}]: ${r}`));

  if (relevantRows.length === 0) {
    console.log(`[Scraper DEBUG] No rows found for part ${partBase}`);
    return { icPartNumber, markingOptions: [], pdfPath: absPath };
  }

  // Look for "Device Marking" values near the matched lines
  const markingOptions = [];
  section.forEach(line => {
    if (line.toUpperCase().includes('LM') || line.toUpperCase().includes('DEVICE MARKING')) {
      const matches = line.match(/[A-Z0-9\-]+/g);
      if (matches) {
        matches.forEach(mark => {
          if (
            mark.length > 3 &&
            !markingOptions.includes(mark) &&
            !/ROHS|GREEN|SN|PKG|TYPE|ACTIVE/.test(mark.toUpperCase())
          ) {
            markingOptions.push(mark);
          }
        });
      }
    }
  });

  console.log('[Scraper DEBUG] Extracted Markings:', markingOptions);

  return { icPartNumber, markingOptions, pdfPath: absPath };
}

module.exports = { extractPartMarkingsFromPDF };
