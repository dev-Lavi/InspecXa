const router = require('express').Router();
const inspectionController = require('../controllers/inspectionController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('icImage'), inspectionController.upload);
router.post('/process', inspectionController.process);
// Updated verify route to send data to ML server for verification
router.post('/verify', upload.single('icImage'), inspectionController.sendForMLVerification);
router.get('/report', inspectionController.report);
router.get('/dashboard', inspectionController.dashboard);
router.get('/list', inspectionController.list);
router.get('/report', inspectionController.report);


module.exports = router;
