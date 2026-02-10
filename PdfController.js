Áconst Pdf = require('../models/Pdf');
const path = require('path');
const fs = require('fs');

exports.upload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'Dosya yÃ¼klenmedi' });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            // Move file from temp (if multer memory storage not used, but using disk storage would be better. 
            // However, existing api.js uses memoryStorage. We need to write buffer to disk manually.)

            // Using existing api.js pattern which has memoryStorage.
            // Sanitize original name (remove non-alphanumeric, keep it clean)
            const safeName = file.originalname.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9]/g, '');
            const filename = `pdf_${safeName}.pdf`;
            const uploadPath = path.join(__dirname, '../../public/uploads/pdfs', filename);
            const publicPath = `/uploads/pdfs/${filename}`;

            // Ensure directory exists
            const dir = path.dirname(uploadPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(uploadPath, file.buffer);

            const newPdf = await Pdf.create({
                originalName: file.originalname,
                filename: filename,
                path: publicPath,
                size: file.size,
                uploadedBy: req.body.uploadedBy || 'System',
                category: req.body.category || '2.El Tarih GÃ¼ncelleme'
            });

            uploadedFiles.push(newPdf);
        }

        res.json({ success: true, files: uploadedFiles });
    } catch (error) {
        console.error('PDF Upload Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.list = async (req, res) => {
    try {
        const pdfs = await Pdf.findAll({ order: [['createdAt', 'DESC']] });
        res.json(pdfs);
    } catch (error) {
        console.error('PDF List Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const pdf = await Pdf.findByPk(id);

        if (!pdf) {
            return res.status(404).json({ success: false, error: 'Dosya bulunamadÄ±' });
        }

        // Delete from filesystem
        const filePath = path.join(__dirname, '../../public', pdf.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from DB
        await pdf.destroy();

        res.json({ success: true, message: 'Dosya silindi' });
    } catch (error) {
        console.error('PDF Delete Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
® *cascade08®Ç *cascade08Çğ*cascade08ğş *cascade08ş„ *cascade08„*cascade08“ *cascade08“œ*cascade08œ  *cascade08 ª *cascade08ª«*cascade08«¬ *cascade08¬°*cascade08°³ *cascade08³´ *cascade08´Á *cascade08ÁÍ*cascade08
ÍÎ ÎÏ*cascade08
Ïç çè *cascade08èì*cascade08ìî *cascade08îõ *cascade08õù*cascade08ùƒ *cascade08ƒµ *cascade08µÿ*cascade08ÿÁ *cascade082Rfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/controllers/PdfController.js