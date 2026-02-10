�*const Settings = require('../models/Settings');

// Default initial settings
const defaultSettings = {
    form: {
        brands: ["FORD", "FIAT", "RENAULT", "VW", "BMW", "MERCEDES", "TOYOTA", "HONDA", "HYUNDAI", "KIA"],
        colors: ["Beyaz", "Siyah", "Gri", "Gümüş", "Kırmızı", "Mavi", "Yeşil", "Sarı", "Turuncu", "Kahverengi"],
        packages: ["Trend", "Titanium", "AMG", "M Sport"]
    },
    company: { name: "Oto Ekspertiz", address: "", phone: "", website: "", logo: "" }
};

exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            console.log("Settings not found, creating default...");
            settings = await Settings.create(defaultSettings);
        }

        // Ensure we retrieve values safely
        const formData = settings.form || defaultSettings.form;
        const companyData = settings.company || defaultSettings.company;
        const reportData = settings.report || { title: "Ekspertiz Raporu", showPrice: false };

        res.json({
            form: formData,
            company: companyData,
            report: reportData
        });
    } catch (err) {
        console.error("Critical Settings Error:", err);
        res.status(500).json({ error: "Ayarlar okunamadı: " + err.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(req.body);
        } else {
            // Update fields individually to trigger setters if needed, or just update
            if (req.body.form) settings.form = req.body.form;
            if (req.body.company) settings.company = req.body.company;
            if (req.body.report) settings.report = req.body.report; // Added report update
            await settings.save();
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Settings Update Error:", err);
        res.status(500).json({ error: "Ayarlar kaydedilemedi: " + err.message });
    }
};

// AI Mock Endpoint (To be enhanced)
// AI Logic (Rule-based for now)
exports.aiAssist = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.json({ response: "Lütfen bir komut girin." });

    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create(defaultSettings);

        let responseText = "Anlaşılamadı. Lütfen 'Firma adını X yap' veya 'Yeni marka ekle: BMW' gibi komutlar deneyin.";
        const lowerPrompt = prompt.toLowerCase();
        let updated = false;

        // 1. Change Company Name
        if (lowerPrompt.includes("firma adı") || lowerPrompt.includes("firma ismini")) {
            const match = prompt.match(/(?:yap|değiştir|olsun)[:\s]+(.+)/i);
            if (match) {
                settings.company = { ...settings.company, name: match[1].trim() };
                responseText = `Firma adı '${match[1].trim()}' olarak güncellendi.`;
                updated = true;
            }
        }

        // 2. Add Brand
        else if (lowerPrompt.includes("marka ekle")) {
            const match = prompt.match(/(?:ekle)[:\s]+(.+)/i);
            if (match) {
                const newBrand = match[1].trim().toUpperCase();
                if (!settings.form.brands.includes(newBrand)) {
                    settings.form.brands.push(newBrand);
                    settings.changed('form', true); // Force update for JSON
                    responseText = `Marka listesine '${newBrand}' eklendi.`;
                    updated = true;
                } else {
                    responseText = `'${newBrand}' zaten listede var.`;
                }
            }
        }

        // 3. Add Color
        else if (lowerPrompt.includes("renk ekle")) {
            const match = prompt.match(/(?:ekle)[:\s]+(.+)/i);
            if (match) {
                const newColor = match[1].trim();
                // Capitalize first letter
                const formattedColor = newColor.charAt(0).toUpperCase() + newColor.slice(1);

                if (!settings.form.colors.includes(formattedColor)) {
                    settings.form.colors.push(formattedColor);
                    settings.changed('form', true);
                    responseText = `Renk listesine '${formattedColor}' eklendi.`;
                    updated = true;
                } else {
                    responseText = `'${formattedColor}' zaten listede var.`;
                }
            }
        }

        // 4. Change Phone
        else if (lowerPrompt.includes("telefon") || lowerPrompt.includes("numara")) {
            const match = prompt.match(/(?:yap|değiştir|olsun)[:\s]+(.+)/i);
            if (match) {
                settings.company = { ...settings.company, phone: match[1].trim() };
                responseText = `Telefon numarası güncellendi.`;
                updated = true;
            }
        }

        if (updated) await settings.save();
        res.json({ response: responseText });

    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ response: "İşlem sırasında hata oluştu." });
    }
};
� *cascade08��*cascade08��* *cascade082Wfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/controllers/SettingsController.js