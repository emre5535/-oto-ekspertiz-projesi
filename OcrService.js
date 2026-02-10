õQconst PImage = require("pureimage");
const stream = require("stream");
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

async function rotateImage(buffer, mimetype, angle) {
    try {
        const Readable = stream.Readable;
        const s = new Readable();
        s.push(buffer);
        s.push(null);

        let img;
        if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
            img = await PImage.decodeJPEGFromStream(s);
        } else if (mimetype === 'image/png') {
            img = await PImage.decodePNGFromStream(s);
        } else {
            return null; // Unsupported
        }

        const w = img.width;
        const h = img.height;
        let newW = w, newH = h;

        // If 90 or 270, swap dimensions
        if (angle === 90 || angle === 270) {
            newW = h;
            newH = w;
        }

        const newImg = PImage.make(newW, newH);
        const ctx = newImg.getContext('2d');

        // Translate and Rotate center
        ctx.translate(newW / 2, newH / 2);
        ctx.rotate(angle * Math.PI / 180);
        ctx.translate(-w / 2, -h / 2);

        ctx.drawImage(img, 0, 0);

        // Encode back to PNG
        const outStream = new stream.PassThrough();
        await PImage.encodePNGToStream(newImg, outStream);
        const chunks = [];
        for await (const chunk of outStream) chunks.push(chunk);
        return Buffer.concat(chunks);

    } catch (e) {
        console.error("Rotate Error:", e.message);
        return null; // Return null on failure, caller handles fallback
    }
}

exports.extractText = async (buffer, mimetype) => {
    // DEBUG LOG PATH (Absolute from Root)
    const logFile = path.join(process.cwd(), 'public', 'ocr-debug.txt');
    const log = (msg) => {
        const line = `[${new Date().toISOString()}] ${msg}`;
        console.log(line); // Console backup
        try { fs.appendFileSync(logFile, line + '\n'); } catch (e) { console.error("Log file fail:", e.message); }
    };

    log(`----------------------------------------------------------------`);
    log(`[START] extractText m:${mimetype} len:${buffer.length}`);

    let text = "";

    try {
        // 1. PDF Text Extraction (Fast)
        if (mimetype === 'application/pdf') {
            log("Processing PDF...");
            try {
                const pdfParse = require('pdf-parse');
                const data = await pdfParse(buffer);
                text = data.text || "";
                log(`PDF raw text len: ${text.length}`);
                log(`PDF Preview: ${text.substring(0, 500).replace(/\n/g, ' ')}...`);

                if (text.replace(/\s/g, '').length > 50) {
                    log("PDF text sufficient. Returning.");
                    return text;
                }
                log("PDF text insufficient. Falling back to OCR (not fully supported for PDF buffers yet).");
            } catch (e) {
                log(`PDF Parse Error: ${e.message}`);
            }
        }

        // 2. Image OCR (or fallback)
        if (mimetype !== 'application/pdf') {
            const runOcr = async (buf) => {
                log("Init Tesseract Worker (tur)...");
                let worker = null;
                try {
                    worker = await Tesseract.createWorker("tur");
                    log("Worker created. Recognizing...");
                    const ret = await worker.recognize(buf);
                    log(`OCR Complete. Conf: ${ret.data.confidence}`);
                    await worker.terminate();
                    return ret.data.text;
                } catch (err) {
                    log(`Tesseract Error: ${err.message}`);
                    if (worker) await worker.terminate();
                    throw err;
                }
            };

            log("Starting OCR attempt 1...");
            text = await runOcr(buffer);
            log(`OCR Result len: ${text.length}`);
            log(`Preview: ${text.substring(0, 500).replace(/[\r\n]+/g, ' ')}...`);
            log(`Preview: ${text.substring(0, 500).replace(/\n/g, ' ')}...`); // Added preview

            // Retry Logic
            const clean = text.replace(/\s/g, '');
            if (clean.length < 20) {
                log("Result poor. Retrying with rotation 90...");
                const rot90 = await rotateImage(buffer, mimetype, 90);
                if (rot90) {
                    const t2 = await runOcr(rot90);
                    if (t2.length > text.length) text = t2;
                }
            }
        }
    } catch (globalErr) {
        log(`CRITICAL OCR ERROR: ${globalErr.message}\n${globalErr.stack}`);
        return "";
    }

    log(`[END] returning text len: ${text.length}`);
    return text;
};

exports.parseData = (text) => {
    // Normalize text: remove excessive spaces, fix common OCR scanning errors
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ');

    // Helper to find value after a specific label/code
    const findValue = (codes, patterns, multiline = false) => {
        // 1. Try Code-based match (e.g. "(D.1) FORD")
        for (const code of codes) {
            const escapedCode = code.replace(/\./g, '\\.?');
            const regex = new RegExp(`(?:${escapedCode})[^\\n\\r:]*[:\\n\\r]+\\s*([^\\n\\r]+)`, 'i');
            const match = cleanText.match(regex);
            if (match && match[1] && match[1].trim().length > 1) return match[1].trim();
        }

        // 2. Try Pattern-based match (fallback)
        for (const pattern of patterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) return match[1].trim();
        }
        return "";
    };

    // --- PLAKA (A) ---
    // (A) PLAKA -> 34ETG012
    const plateRegex = /(0[1-9]|[1-7][0-9]|8[01])\s*([A-Z]{1,3})\s*(\d{2,5})/i;
    const plateRegexLoose = /\b(0[1-9]|[1-7][0-9]|8[01])\s*[A-Z]{1,3}\s*\d{2,5}\b/i;

    let plakaRaw = findValue(['\\(A\\)', 'A\\.', 'PLAKA', 'Plaka'], [plateRegex]);

    if (!plakaRaw) {
        // Fallback 1: Search anywhere in text (Loose)
        const match = cleanText.match(plateRegexLoose);
        if (match) plakaRaw = match[0];
    }

    if (!plakaRaw) {
        // Fallback 2: Try to find pattern with 'TR' prefix
        const matchTR = cleanText.match(/TR\s*(0[1-9]|[1-7][0-9]|8[01])\s*([A-Z]{1,3})\s*(\d{2,5})/i);
        if (matchTR) plakaRaw = matchTR[0];
    }

    if (!plakaRaw) {
        // Fallback 3: Aggressive space removal check for specific patterns
        // e.g. 34  ET  6012
        const matchAgg = cleanText.match(/(0[1-9]|[1-7][0-9]|8[01])\s{0,4}([A-Z]{1,3})\s{0,4}(\d{2,5})/);
        if (matchAgg) plakaRaw = matchAgg[0];
    }

    let plaka = plakaRaw ? plakaRaw.replace(/[^A-Z0-9]/g, '').toUpperCase() : "";

    // Correction: If length is weird (e.g. 34A12) might be wrong, but keep for now.
    // Common OCR fix: 'O' -> '0' if at start? Hard to say without context.


    // --- MARKA (D.1) ---
    const marka = findValue(['\\(D\\.1\\)', 'D\\.1', 'D1', 'MARKASI'], [
        /(?:Markasƒ±|Marka)\s*[:.]?\s*([A-Z\s]+)/i
    ]).split(' ')[0];

    // --- MODEL (D.3) ---
    const model = findValue(['\\(D\\.3\\)', 'D\\.3', 'D3', 'TICARI ADI'], [
        /(?:Ticari\s*Adƒ±|Modeli)\s*[:.]?\s*([A-Z0-9\s]+)/i
    ]);

    // --- YIL (D.4) ---
    const yil = findValue(['\\(D\\.4\\)', 'D\\.4', 'D4', 'MODEL YILI'], [
        /20[0-2][0-9]|19[8-9][0-9]/
    ]);

    // --- ≈ûASƒ∞ (E) ---
    let sasi = findValue(['\\(E\\)', 'E\\.', 'SASE NO', '≈ûASE NO'], [
        /[A-HJ-NPR-Z0-9]{17}/
    ]);
    if (!sasi) {
        const lenient = cleanText.match(/(?:E|≈ûase)\s*[:.]?\s*([A-Z0-9]+)/i);
        if (lenient) sasi = lenient[1].replace(/[^A-Z0-9]/g, '');
        if (sasi && sasi.length > 17) sasi = sasi.substring(0, 17);
    }

    // --- MOTOR (P.5) ---
    const motor = findValue(['\\(P\\.5\\)', 'P\\.5', 'P5', 'MOTOR NO'], [
        /(?:Motor\s*No)\s*[:.]?\s*([A-Z0-9]+)/i
    ]);

    // --- RENK (R) ---
    let renk = findValue(['\\(R\\)', 'R\\.', 'RENGI', 'RENK'], [
        /(?:Rengi|Renk)\s*[:.]?\s*([A-Zƒ∞ƒû√ú≈û√ñ√á\s]+)/i
    ]);

    // --- YAKIT ---
    let yakitRaw = findValue(['\\(P\\.3\\)', 'P\\.3', 'P3', 'YAKIT'], []);
    let yakit = "";
    if (yakitRaw.match(/DIZEL|Dƒ∞ZEL/i) || cleanText.match(/Dƒ∞ZEL|Diesel/i)) yakit = "Dizel";
    else if (yakitRaw.match(/BENZIN|BENZƒ∞N/i) || cleanText.match(/BENZƒ∞N/i)) yakit = "Benzin";
    else if (yakitRaw.match(/LPG/i) || cleanText.match(/LPG/i)) yakit = "LPG";
    else if (yakitRaw.match(/HIBRIT|Hƒ∞BRƒ∞T/i) || cleanText.match(/Hƒ∞BRƒ∞T/i)) yakit = "Hibrit";
    else if (yakitRaw.match(/ELEKTRIK/i) || cleanText.match(/ELEKTRƒ∞K/i)) yakit = "Elektrik";

    // --- Vƒ∞TES ---
    let vites = "";
    if (cleanText.match(/OTOMATƒ∞K|OTOMATIK/i)) vites = "Otomatik";
    else if (cleanText.match(/MANUEL|D√úZ/i)) vites = "Manuel";

    // --- SAHƒ∞Bƒ∞ ---
    let adSoyad = findValue(['\\(C\\.1\\.1\\)', 'C\\.1\\.1', 'SOYADI'], []);
    const ad = findValue(['\\(C\\.1\\.2\\)', 'C\\.1\\.2', 'ADI'], []);
    if (ad && !adSoyad.includes(ad)) adSoyad = `${ad} ${adSoyad}`;
    adSoyad = adSoyad.replace(/[:.]/g, '').trim();
    if (adSoyad.length < 3) {
        const ownerMatch = cleanText.match(/(?:SAHƒ∞Bƒ∞|Sahibi)\s*[:.]?\s*([A-Z\sƒû√ú≈ûƒ∞√ñ√á]+)/i);
        if (ownerMatch) adSoyad = ownerMatch[1].trim();
    }

    // --- KASA Tƒ∞Pƒ∞ ---
    let kasaTipi = "Sedan";
    const cinsi = findValue(['\\(D\\.5\\)', 'D\\.5', 'CINSI', 'Cƒ∞NSƒ∞'], []);
    if (cinsi.match(/KAMYONET|Tƒ∞CARƒ∞|PANELVAN/i)) kasaTipi = "Ticari";
    else if (cinsi.match(/STATION|SW/i)) kasaTipi = "Station";
    else if (cinsi.match(/JEEP|Jƒ∞P|SUV|ARAZƒ∞/i)) kasaTipi = "SUV";
    else if (cinsi.match(/HATCHBACK|HB/i)) kasaTipi = "Hatchback";

    // --- DOC TYPE ---
    let docType = "R";
    if (cleanText.match(/SATI≈û|SATIS|SOZLESME|S√ñZLE≈ûME|NOTER|DEVƒ∞R|DEVIR/i)) docType = "S";

    return {
        plaka, marka, model, yil, sasi, motor, renk, yakit, vites,
        ad_soyad: adSoyad,
        kasa_tipi: kasaTipi,
        docType: docType
    };
};
I *cascade08IØ*cascade08Øæ *cascade08æÍ*cascade08ÍÔ *cascade08Ô¯ *cascade08¯¸*cascade08¸â *cascade08âä*cascade08äã *cascade08ãç*cascade08çé *cascade08éñ*cascade08ñü *cascade08ü£*cascade08£Ÿ *cascade08Ÿ›*cascade08›ﬂ *cascade08ﬂ·*cascade08·„ *cascade08„Â*cascade08Âã *cascade08ãÓ*cascade08Ó *cascade08Ò*cascade08ÒÇ *cascade08ÇÆ*cascade08Æª *cascade08ªâ*cascade08âí *cascade08íì*cascade08ìî *cascade08îô*cascade08ô¥ *cascade08¥µ*cascade08µ∂ *cascade08∂∑*cascade08∑Õ *cascade08Õœ*cascade08œ” *cascade08”È *cascade08È¯*cascade08¯Ç *cascade08Çã*cascade08ãå *cascade08åé*cascade08éè *cascade08èê*cascade08êë *cascade08ëò*cascade08òö *cascade08öû*cascade08û– *cascade08–⁄ *cascade08⁄ﬁ*cascade08ﬁﬂ *cascade08ﬂ·*cascade08· *cascade08¸ *cascade08¸ì*cascade08ìª *cascade08ªΩ*cascade08Ω… *cascade08…À*cascade08ÀÒ *cascade08Ò˝ *cascade08˝™*cascade08™≥ *cascade08≥¥*cascade08¥µ *cascade08µ∂*cascade08∂∑ *cascade08∑∏*cascade08∏π *cascade08π∫*cascade08∫º *cascade08ºΩ*cascade08Ω√ *cascade08√∆*cascade08∆» *cascade08»…*cascade08…  *cascade08 Ã*cascade08ÃÕ *cascade08Õ‘ *cascade08‘´*cascade08´≠ *cascade08≠Æ *cascade08Æø*cascade08ø¿ *cascade08¿¡*cascade08¡∆ *cascade08∆Ÿ*cascade08Ÿ‡ *cascade08‡·*cascade08·‚ *cascade08‚„*cascade08„Â *cascade08ÂÁ*cascade08ÁÈ *cascade08Èˆ *cascade08ˆÖ*cascade08Öï *cascade08ïñ*cascade08ñó *cascade08óò*cascade08òû *cascade08û†*cascade08†° *cascade08°§*cascade08§¶ *cascade08¶´*cascade08´∏ *cascade08∏º*cascade08ºΩ *cascade08Ω¡*cascade08¡≈ *cascade08≈ﬂ*cascade08ﬂ‡ *cascade08‡Û*cascade08Û¯ *cascade08¯Ç*cascade08ÇÉ *cascade08Éä*cascade08äã *cascade08ãê*cascade08êí *cascade08íõ*cascade08õú *cascade08úü*cascade08ü† *cascade08†£*cascade08£§ *cascade08§¨*cascade08¨≠ *cascade08≠≥*cascade08≥¥ *cascade08¥ø*cascade08ø¿ *cascade08¿√*cascade08√ƒ *cascade08ƒ»*cascade08»  *cascade08 Œ*cascade08ŒÂ *cascade08ÂË*cascade08ËÙ *cascade08Ùı*cascade08ı˘ *cascade08˘˙*cascade08˙ã *cascade08ãç*cascade08çñ *cascade08ñò*cascade08ò§ *cascade08§®*cascade08®´ *cascade08´Ø*cascade08Øº *cascade08º¿*cascade08¿œ *cascade08œ›*cascade08›ﬂ*cascade08ﬂñ *cascade08ñö*cascade08öª *cascade08ªº*cascade08º» *cascade08»À*cascade08À– *cascade08–“*cascade08“” *cascade08”‘*cascade08‘ﬁ *cascade08ﬁﬂ*cascade08ﬂÂ *cascade08ÂÊ*cascade08ÊÛ *cascade08Ûõ*cascade08õÆ *cascade08Æ±*cascade08±¡ *cascade08¡Ò *cascade08ÒÙ*cascade08ÙÑ *cascade08ÑÖ*cascade08Öã*cascade08ãê *cascade08êí*cascade08íî *cascade08îú*cascade08ú¢ *cascade08¢©*cascade08©≠ *cascade08≠±*cascade08±Ω *cascade08ΩÕ*cascade08Õ€ *cascade08€ﬂ*cascade08ﬂ‡ *cascade08‡‚*cascade08‚‰ *cascade08‰Á*cascade08ÁÎ *cascade08ÎÓ*cascade08Ó˛ *cascade08˛ˇ*cascade08ˇÉ *cascade08ÉÜ*cascade08Üà *cascade08àâ*cascade08âé *cascade08éè *cascade08èí *cascade08íî*cascade08îï *cascade08ïó*cascade08óò *cascade08òö*cascade08öú *cascade08úù*cascade08ùû *cascade08û¢*cascade08¢£ *cascade08£Ø*cascade08Ø± *cascade08±≥ *cascade08≥∑*cascade08∑« *cascade08«À*cascade08ÀÕ *cascade08Õ“*cascade08“” *cascade08”’*cascade08’÷ *cascade08÷ÿ*cascade08ÿŸ *cascade08Ÿ‹*cascade08‹Ú *cascade08ÚÛ *cascade08Ûı *cascade08ıˆ *cascade08ˆ¯ *cascade08¯˘ *cascade08˘˚*cascade08˚¸ *cascade08¸˝ *cascade08˝Ç *cascade08ÇÖ *cascade08ÖÜ*cascade08Üá *cascade08áä*cascade08äß *cascade08ß©*cascade08©¨ *cascade08¨Æ *cascade08Æ≤*cascade08≤Ω *cascade08Ωæ *cascade08æ¬*cascade08¬√ *cascade08√»*cascade08»… *cascade08…À*cascade08ÀÕ *cascade08Õ“*cascade08“’ *cascade08’◊*cascade08◊ÿ *cascade08ÿ€*cascade08€‹ *cascade08‹ﬂ*cascade08ﬂ‡ *cascade08‡‚*cascade08‚„ *cascade08„‰*cascade08‰Â *cascade08ÂÁ*cascade08ÁÎ *cascade08Î˜ *cascade08˜˚*cascade08˚Ö*cascade08ÖÜ *cascade08Üå*cascade08åç *cascade08çê*cascade08êë *cascade08ëï*cascade08ïñ *cascade08ñó *cascade08óö*cascade08öõ *cascade08õ£*cascade08£§ *cascade08§≤ *cascade08≤∫ *cascade08∫√*cascade08√œ *cascade08œ◊*cascade08◊Â *cascade08ÂÈ*cascade08ÈÎ *cascade08Î¸ *cascade08¸Å*cascade08Åâ *cascade08âä*cascade08äí *cascade08íï*cascade08ïö *cascade08ö– *cascade08–ÿ*cascade08ÿ€ *cascade08€ﬁ*cascade08ﬁﬂ *cascade08ﬂ‰*cascade08‰Â *cascade08ÂÁ*cascade08ÁÈ *cascade08È¯ *cascade08¯¥  *cascade08¥ à!*cascade08à!¨! *cascade08¨!∂! *cascade08∂!∫! *cascade08∫!º!*cascade08º!Ω! *cascade08Ω!æ!*cascade08æ!ø! *cascade08ø!¡!*cascade08¡!√! *cascade08√!»!*cascade08»!¥" *cascade08¥"¥"*cascade08¥"∫" *cascade08∫"ø"*cascade08ø"Ë# *cascade08Ë#È#*cascade08È#õ$ *cascade08õ$ú$*cascade08ú$¶$ *cascade08¶$ß$*cascade08ß$®$ *cascade08®$™$*cascade08™$∏$ *cascade08∏$π$*cascade08π$ª$ *cascade08ª$Ω$*cascade08Ω$È$ *cascade08È$Í$*cascade08Í$$ *cascade08$Ò$*cascade08Ò$ı$ *cascade08ı$˜$*cascade08˜$¯$ *cascade08¯$˚$*cascade08˚$¸$ *cascade08¸$˝$*cascade08˝$˛$ *cascade08˛$Ä%*cascade08Ä%è% *cascade08è%ú%*cascade08ú%ù% *cascade08ù%†%*cascade08†%°% *cascade08°%ß%*cascade08ß%®% *cascade08®%¨%*cascade08¨%≠% *cascade08≠%Æ%*cascade08Æ%Ø% *cascade08Ø%±%*cascade08±%¥% *cascade08¥%µ%*cascade08µ%∂% *cascade08∂%∏%*cascade08∏%π% *cascade08π%∫%*cascade08∫%ª% *cascade08ª%º%*cascade08º%æ% *cascade08æ%¿%*cascade08¿%¬% *cascade08¬%ƒ%*cascade08ƒ%≈% *cascade08≈%…%*cascade08…% % *cascade08 %À%*cascade08À%Ã% *cascade08Ã%—%*cascade08—%“% *cascade08“%”%*cascade08”%‰% *cascade08‰%Ê%*cascade08Ê%¯% *cascade08¯%˘%*cascade08˘%˙% *cascade08˙%˚%*cascade08˚%Ä&*cascade08Ä&Å& *cascade08Å&Ç& *cascade08Ç&Ö&*cascade08Ö&Ü&*cascade08Ü&ì&*cascade08ì&ó& *cascade08ó&ò&*cascade08ò&ô& *cascade08ô&õ&*cascade08õ&ú& *cascade08ú&ù&*cascade08ù&û& *cascade08û&ü&*cascade08ü&†& *cascade08†&¢&*cascade08¢&¶& *cascade08¶&ƒ. *cascade08ƒ.Ì/*cascade08Ì/°0 *cascade08°0™0*cascade08™0Æ0 *cascade08Æ0”0*cascade08”0ﬁ0 *cascade08ﬁ0˘2*cascade08˘2Æ3 *cascade08Æ3∑3*cascade08∑3π3 *cascade08π3¡3*cascade08¡3¬3 *cascade08¬3 3*cascade08 3À3 *cascade08À3Œ3*cascade08Œ3œ3 *cascade08œ3–3*cascade08–3—3 *cascade08—3Ÿ3*cascade08Ÿ3⁄3 *cascade08⁄3ﬁ3*cascade08ﬁ3‰3 *cascade08‰3Á3*cascade08Á3Ì3 *cascade08Ì3í4 *cascade08í4î4*cascade08î4ñ4 *cascade08ñ4õ4*cascade08õ4ú4 *cascade08ú4ü4*cascade08ü4†4 *cascade08†4£4*cascade08£4•4 *cascade08•4¶4*cascade08¶4ß4 *cascade08ß4¨4*cascade08¨4≠4 *cascade08≠4∞4*cascade08∞4≤4 *cascade08≤4¥4*cascade08¥4π4 *cascade08π4∫4*cascade08∫4ª4 *cascade08ª4√4*cascade08√4ƒ4 *cascade08ƒ4≈4*cascade08≈4«4 *cascade08«4Ë4*cascade08Ë4˝4 *cascade08˝4Ä5*cascade08Ä5Ø5 *cascade08Ø5¥5*cascade08¥5¬5 *cascade08¬5«5*cascade08«5Ê5 *cascade08Ê5È5*cascade08È5˚5 *cascade08˚5˛5*cascade08˛5ã6 *cascade08ã6ç6*cascade08ç6ë6 *cascade08ë6ì6*cascade08ì6•6 *cascade08•6∞6*cascade08∞6 6 *cascade08 6ÿ6*cascade08ÿ6›6*cascade08›6ﬁ6 *cascade08ﬁ6Ö8*cascade08Ö8¬> *cascade08¬> >*cascade08 >«M *cascade08«M«M*cascade08«MŸN *cascade08ŸNÌO *cascade08ÌOÚP *cascade08ÚPçQ*cascade08çQõQ *cascade082Lfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/services/OcrService.js