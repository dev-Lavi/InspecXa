const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function extractPartMarkingsFromPDF(pdfPath, icPartNumber) {
  const absPath = path.isAbsolute(pdfPath) ? pdfPath : path.resolve(pdfPath);
  if (!fs.existsSync(absPath)) {
    console.log('[Scraper DEBUG] PDF does not exist:', absPath);
    return { icPartNumber, markingOptions: [], pdfPath: absPath };
  }

  const dataBuffer = fs.readFileSync(absPath);
  const data = await pdf(dataBuffer);

  const lines = data.text.split('\n');
  // Find the first line with "PACKAGING INFORMATION"
  const packagingIndex = lines.findIndex(l => l.toUpperCase().includes('PACKAGING INFORMATION'));
  console.log('[Scraper DEBUG] Found PACKAGING INFORMATION at line:', packagingIndex);

  if (packagingIndex === -1) {
    console.log('[Scraper DEBUG] PACKAGING INFORMATION section not found.');
    return { icPartNumber, markingOptions: [], pdfPath: absPath };
  }

  // Get next 100 lines (should be sufficient for the whole table/page)
  const tableLines = lines.slice(packagingIndex, packagingIndex + 100);
  console.log('[Scraper DEBUG] Table preview:\n', tableLines.slice(0, 10).join('\n'));

  // Extract the base/root of the part for matching
  const partBase = icPartNumber.match(/[A-Za-z]+\d+/i) ? icPartNumber.match(/[A-Za-z]+\d+/i)[0] : icPartNumber;
  const relevantRows = tableLines.filter(line => line.toUpperCase().includes(partBase.toUpperCase()));
  console.log('[Scraper DEBUG] Matched lines:', relevantRows.length);
  relevantRows.forEach((l, i) => console.log(`[ROW ${i+1}]: ${l}`));

  let markingOptions = [];
  relevantRows.forEach(row => {
    const cols = row.trim().split(/\s{2,}/);
    let cell = cols[cols.length - 1];
    if (cell) {
      cell.split(/[\s\n,;]+/).forEach(marking => {
        const cleaned = marking.trim();
        if (cleaned && !markingOptions.includes(cleaned)) {
          markingOptions.push(cleaned);
        }
      });
    }
  });

  return { icPartNumber, markingOptions, pdfPath: absPath };
}

module.exports = { extractPartMarkingsFromPDF };
