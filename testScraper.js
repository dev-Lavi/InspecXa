const scraper = require('./utils/scraper');
const path = require('path');

const icPartNumber = 'LM324N';
const pdfPath = path.resolve(__dirname, 'pdf-database', `${icPartNumber}.pdf`);

scraper.extractPartMarkingsFromPDF(pdfPath, icPartNumber)
  .then(data => {
    if (data && data.markingOptions && data.markingOptions.length) {
      console.log('Extracted device marking details:');
      data.markingOptions.forEach((marking, idx) => {
        console.log(`  ${idx + 1}. ${marking}`);
      });
      console.log('PDF source:', data.pdfPath);
    } else {
      console.log(`No device marking found for ${icPartNumber} in ${data.pdfPath}`);
    }
  })
  .catch(err => {
    console.error('Error during extraction:', err.message);
  });
