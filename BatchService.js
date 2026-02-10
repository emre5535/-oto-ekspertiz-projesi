„(const { PDFDocument } = require('pdf-lib');
const OcrService = require('./OcrService');
// const pureimage = require('pureimage'); // Skipping logic that relies on this for now if possible, or using it if needed for img->pdf

class BatchService {

    // Process multiple files: Split PDFs, Convert Images -> PDF, OCR all
    async processBatch(files) {
        const results = [];

        for (const file of files) {
            try {
                if (file.mimetype === 'application/pdf') {
                    // Split PDF
                    const pages = await this.splitPdf(file.buffer);
                    for (let i = 0; i < pages.length; i++) {
                        const pdfBuffer = pages[i];
                        const ocrResult = await OcrService.extractText(pdfBuffer, 'application/pdf');
                        let data = OcrService.parseData(ocrResult);

                        // FALLBACK: If strict parsing failed, try finding ANY license plate pattern (Same as OcrService)
                        if (!data.plaka && ocrResult) {
                            const plateRegexLoose = /\b(0[1-9]|[1-7][0-9]|8[01])\s*[A-Z]{1,3}\s*\d{2,5}\b/i;
                            const match = ocrResult.match(plateRegexLoose);
                            if (match) data.plaka = match[0].replace(/[^A-Z0-9]/i, '').toUpperCase();
                        }

                        const plaka = data.plaka || `BELGE_${Date.now()}_${i + 1}`;
                        const typeSuffix = data.docType || 'R'; // Default R
                        const finalName = data.plaka ? `${plaka} ${typeSuffix}` : plaka;

                        results.push({
                            originalName: file.originalname,
                            index: i + 1,
                            buffer: pdfBuffer,
                            plaka: plaka,
                            fileName: `${finalName}.pdf`,
                            type: data.docType === 'S' ? 'SatÄ±ÅŸ SÃ¶zleÅŸmesi' : 'Ruhsat'
                        });
                    }
                } else if (file.mimetype.startsWith('image/')) {
                    // Convert Image to PDF
                    const pdfBuffer = await this.imageToPdf(file.buffer, file.mimetype);

                    // OCR (Image)
                    const ocrResult = await OcrService.extractText(file.buffer, file.mimetype);
                    const data = OcrService.parseData(ocrResult);

                    if (!data.plaka && ocrResult) {
                        const plateRegexLoose = /\b(0[1-9]|[1-7][0-9]|8[01])\s*[A-Z]{1,3}\s*\d{2,5}\b/i;
                        const match = ocrResult.match(plateRegexLoose);
                        if (match) data.plaka = match[0].replace(/[^A-Z0-9]/i, '').toUpperCase();
                    }

                    const plaka = data.plaka || `RESIM_${Date.now()}`;
                    const typeSuffix = data.docType || 'R';
                    const finalName = data.plaka ? `${plaka} ${typeSuffix}` : plaka;

                    results.push({
                        originalName: file.originalname,
                        index: 1,
                        buffer: pdfBuffer,
                        plaka: plaka,
                        fileName: `${finalName}.pdf`,
                        type: data.docType === 'S' ? 'SatÄ±ÅŸ SÃ¶zleÅŸmesi' : 'Ruhsat'
                    });
                }
            } catch (error) {
                console.error(`Error processing ${file.originalname}:`, error);
                results.push({
                    originalName: file.originalname,
                    error: error.message
                });
            }
        }
        return results;
    }

    async splitPdf(buffer) {
        const pdfDoc = await PDFDocument.load(buffer);
        const pageCount = pdfDoc.getPageCount();
        const pages = [];

        for (let i = 0; i < pageCount; i++) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
            const pdfBytes = await newPdf.save();
            pages.push(Buffer.from(pdfBytes));
        }
        return pages;
    }

    async imageToPdf(buffer, mimetype) {
        const pdfDoc = await PDFDocument.create();
        let image;

        if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
            image = await pdfDoc.embedJpg(buffer);
        } else if (mimetype === 'image/png') {
            image = await pdfDoc.embedPng(buffer);
        } else {
            throw new Error("Desteklenmeyen resim formatÄ± (Sadece JPG/PNG)");
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
}

module.exports = new BatchService();
é *cascade08éþ*cascade08þß *cascade08ßê*cascade08êî *cascade08îð*cascade08ð 	 *cascade08 	¢	*cascade08¢	¤	 *cascade08¤	ð	ð	º
 *cascade08º
Ã
*cascade08Ã
Ä
 *cascade08Ä
Å
*cascade08Å
š *cascade08š›*cascade08› *cascade08£*cascade08£¤ *cascade08¤¨*cascade08¨© *cascade08©«*cascade08«Û *cascade08ÛÝ*cascade08Ýß *cascade08ß§§í *cascade08íö*cascade08ö÷ *cascade08÷ø*cascade08ø„( *cascade082Nfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/services/BatchService.js