ç$const express = require('express');
const router = express.Router();
const multer = require('multer');

const AracController = require('../controllers/AracController');
const SettingsController = require('../controllers/SettingsController');
const UserController = require('../controllers/UserController');
const NotificationController = require('../controllers/NotificationController'); // New
const SchemaController = require('../controllers/SchemaController'); // New
const OcrService = require('../services/OcrService');
const BatchService = require('../services/BatchService');
const PdfController = require('../controllers/PdfController'); // New
const MailController = require('../controllers/MailController'); // New

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- NOTIFICATION ROUTES ---
router.get('/notifications', NotificationController.getNotifications);
router.put('/notifications/:id/read', NotificationController.markRead);


// --- BATCH ROUTES ---
router.post('/batch-upload', upload.array('files', 10), BatchService.processBatch);

// --- PDF ROUTES ---
router.get('/pdfs', PdfController.list);
router.post('/pdfs', upload.array('files', 10), PdfController.upload);
router.delete('/pdfs/:id', PdfController.delete);


// --- ARAC ROUTES ---
router.get('/stats', AracController.getStats);
router.get('/araclar', AracController.getAll);
router.post('/arac-ekle', AracController.create);
router.get('/arac/:plaka', AracController.getOne); // or :id
router.put('/arac/:plaka', AracController.update);
router.delete('/arac/:id', AracController.delete); // standardized to ID

// --- SETTINGS ROUTES ---
router.get('/settings', SettingsController.getSettings);
router.post('/settings', SettingsController.updateSettings);
router.post('/ai-assist', SettingsController.aiAssist);

// --- USER ROUTES ---
router.post('/login', UserController.login);
router.get('/kullanicilar', UserController.list);
router.post('/kullanici-ekle', UserController.create);
router.put('/kullanici/:id', UserController.update);
router.delete('/kullanici/:id', UserController.delete);

// --- SCHEMA ROUTES ---
router.get('/schemas', SchemaController.getSchemas);
router.post('/schemas', SchemaController.saveSchemas);

// --- OCR ROUTES ---
// OCR (Original)
router.post('/ocr', upload.single('ruhsat'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ basarili: false, hata: "Dosya yok" });

        const text = await OcrService.extractText(req.file.buffer, req.file.mimetype);
        if (!text) return res.status(400).json({ basarili: false, hata: "Metin okunamadƒ±" });

        const data = OcrService.parseData(text);

        res.json({ basarili: true, veri: data });
    } catch (e) {
        console.error("OCR API Error:", e);
        res.status(500).json({ basarili: false, hata: e.message });
    }
});

// BATCH RENAME (New)
// Helper to handle Multer errors
const uploadBatch = (req, res, next) => {
    upload.array('files', 10)(req, res, (err) => {
        if (err) {
            console.error("Upload Error:", err);
            return res.status(400).json({ success: false, error: "Dosya Y√ºkleme Hatasƒ±: " + err.message });
        }
        next();
    });
};

// BATCH RENAME (New)
router.post('/batch-rename', uploadBatch, async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: "Dosya se√ßilmedi" });
        }

        const results = await BatchService.processBatch(req.files);

        // Convert buffers to base64
        const responseData = results.map(r => ({
            ...r,
            dataUrl: r.buffer ? `data:application/pdf;base64,${r.buffer.toString('base64')}` : null,
            buffer: undefined
        }));

        res.json({ success: true, results: responseData });
    } catch (e) {
        console.error("Batch API Error:", e);
        res.status(500).json({ success: false, error: "ƒ∞≈ülem Hatasƒ±: " + e.message });
    }
});

// Logo Upload Route (Simplified)
router.post('/upload-logo', upload.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });
    // In real app, save to disk. For now mock:
    res.json({ success: true, url: '/uploads/logo.png' });
});

// --- MAIL ROUTES ---
router.post('/mail/takas', MailController.generateTakasExcel);

module.exports = router;
ô *cascade08ôÊÊ“ *cascade08“ô*cascade08ô‚*cascade08‚ü	 *cascade08ü	ﬂ
*cascade08ﬂ
” *cascade08”ââ∑ *cascade08∑¡*cascade08¡ô# *cascade08ô#Û#*cascade08Û#ç$ *cascade082Cfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/routes/api.js