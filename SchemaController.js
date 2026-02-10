…const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const SCHEMA_FILE = path.join(DATA_DIR, 'schemas.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

exports.getSchemas = (req, res) => {
    try {
        if (!fs.existsSync(SCHEMA_FILE)) {
            return res.json({}); // Return empty if no custom schemas
        }
        const data = fs.readFileSync(SCHEMA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        console.error("Schema Read Error:", e);
        res.status(500).json({ error: "≈ûemalar okunamadƒ±" });
    }
};

exports.saveSchemas = (req, res) => {
    try {
        const newSchemas = req.body;
        console.log("üì• Schema Save Request Received. Body size:", JSON.stringify(newSchemas).length);

        if (!newSchemas || Object.keys(newSchemas).length === 0) {
            console.warn("‚ö†Ô∏è Schema save rejected: Empty body");
            return res.status(400).json({ error: "Veri yok veya bo≈ü" });
        }

        // Merge with existing if needed, or overwrite. 
        // For simplicity, we overwrite the file with the full state sent from client.

        fs.writeFileSync(SCHEMA_FILE, JSON.stringify(newSchemas, null, 2));
        console.log("‚úÖ Schemas saved successfully to:", SCHEMA_FILE);
        res.json({ success: true });
    } catch (e) {
        console.error("Schema Save Error:", e);
        res.status(500).json({ error: "≈ûemalar kaydedilemedi" });
    }
};
† *cascade08†å*cascade08åõ *cascade08õµ*cascade08µ∂ *cascade08∂ô*cascade08ô» *cascade08»“*cascade08“◊ *cascade08◊‚*cascade08‚√
 *cascade08√
å*cascade08å… *cascade082Ufile:///c:/Users/Emmi/Documents/ekspertiz-node/server/controllers/SchemaController.js