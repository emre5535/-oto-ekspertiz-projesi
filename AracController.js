ôconst Arac = require('../models/Arac');

const { Sequelize } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        const toplamArac = await Arac.count();
        const toplamDeger = await Arac.sum('takas_alim_fiyati') || 0;
        const simdi = new Date();
        const buAyBaslangic = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
        const buAyEklenen = await Arac.count({
            where: { createdAt: { [Sequelize.Op.gte]: buAyBaslangic } }
        });
        res.json({ toplamArac, toplamDeger, buAyEklenen });
    } catch (err) {
        res.status(500).json({ error: "ƒ∞statistikler alƒ±namadƒ±: " + err.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const araclar = await Arac.findAll();
        res.json(araclar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const yeniArac = await Arac.create(req.body);
        res.status(201).json(yeniArac);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const NotificationController = require('../controllers/NotificationController');
const Kullanici = require('../models/Kullanici');

exports.update = async (req, res) => {
    try {
        const { plaka } = req.params;
        let condition;
        // If plaka parameter is numeric, assume it's an ID (fallback for missing plaka)
        if (!isNaN(plaka)) {
            condition = { id: plaka };
        } else {
            condition = { plaka: plaka };
        }

        // Check for Price Update Notification
        if (req.body.fiyat_alim) {
            const current = await Arac.findOne({ where: condition });
            // If price changed or wasn't set
            if (current && (!current.fiyatlandirildi || current.fiyat_alim != req.body.fiyat_alim)) {
                // If Advisor name ('talep_eden') is set, find user and notify
                if (current.talep_eden) {
                    const advisor = await Kullanici.findOne({ where: { adSoyad: current.talep_eden } });
                    if (advisor) {
                        await NotificationController.createInternal(
                            advisor.id,
                            `'${current.plaka}' plakalƒ± ara√ß fiyatlandƒ±: ${req.body.fiyat_alim} TL`,
                            `arac-detay.html?id=${current.plaka}`
                        );
                    }
                }
                req.body.fiyatlandirildi = true;
            }
        }

        await Arac.update(req.body, { where: condition });
        res.json({ basarili: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        // If id looks like a number, treat as ID. If it is long string (plaka), treat as plaka.
        // Actually best is to check if it parses to int.

        let condition;
        if (!isNaN(id)) {
            condition = { id };
        } else {
            condition = { plaka: id };
        }

        await Arac.destroy({ where: condition });
        res.json({ basarili: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const arac = await Arac.findOne({ where: { plaka: req.params.plaka } });
        if (arac) res.json(arac);
        else res.status(404).json({ error: "Bulunamadƒ±" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
Œ
 *cascade08Œ
”
*cascade08”
Ì
 *cascade08Ì
Ò
*cascade08Ò
Ù
 *cascade08Ù
úúù *cascade08ùØ*cascade08Ø∞ *cascade08∞Ä*cascade08Äç *cascade08çè*cascade08èë *cascade08ëí*cascade08íì *cascade08ìò*cascade08òô *cascade08ô†*cascade08†° *cascade08°§*cascade08§ß *cascade08ß∆∆ÿ *cascade08ÿ„*cascade08„Ô *cascade08Ô©*cascade08©≈ *cascade08≈À*cascade08ÀÃ *cascade08ÃŒ*cascade08Œô *cascade082Sfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/controllers/AracController.js