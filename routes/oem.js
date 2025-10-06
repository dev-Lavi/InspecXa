const router = require('express').Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const oemController = require('../controllers/oemController');

// Upload OEM PDF
router.post('/upload-oem-pdf', upload.single('pdfFile'), oemController.uploadOemPdf);

// Download OEM PDF
router.get('/pdf/:icPartNumber', oemController.downloadOemPdf);

// Delete OEM PDF
router.delete('/pdf/:icPartNumber', oemController.deleteOemPdf);

module.exports = router;
