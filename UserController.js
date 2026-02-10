¶const Kullanici = require('../models/Kullanici');

// Basic Login
exports.login = async (req, res) => {
    const { kullaniciAdi, sifre } = req.body;
    const user = await Kullanici.findOne({ where: { kullaniciAdi, sifre } });
    if (user) {
        // Map legacy isAdmin if role is missing, or prefer role
        let role = user.role || (user.isAdmin ? 'Admin' : 'DanÄ±ÅŸman');

        // Sync isAdmin for frontend logic (legacy support)
        const isAdmin = role === 'Admin' || user.isAdmin;

        res.json({
            basarili: true,
            mesaj: "GiriÅŸ BaÅŸarÄ±lÄ±",
            user: {
                id: user.id,
                adSoyad: user.adSoyad,
                kullaniciAdi: user.kullaniciAdi,
                role: role,
                rol: role, // Keep both for compatibility
                isAdmin: isAdmin,
                canDelete: user.canDelete,
                canEdit: user.canEdit !== false, // Default true if undefined
                canViewPrice: user.canViewPrice !== false
            }
        });
    } else {
        res.status(401).json({ basarili: false, mesaj: "HatalÄ± KullanÄ±cÄ± AdÄ± veya Åifre" });
    }
};

exports.list = async (req, res) => {
    const users = await Kullanici.findAll();
    res.json(users);
};

exports.create = async (req, res) => {
    try {
        // Ensure isAdmin is synced with role if role is Admin
        if (req.body.role === 'Admin') req.body.isAdmin = true;
        await Kullanici.create(req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Don't update password if empty
        if (!updateData.sifre) delete updateData.sifre;

        // Sync isAdmin
        if (updateData.role === 'Admin') updateData.isAdmin = true;
        else if (updateData.role) updateData.isAdmin = false;

        await Kullanici.update(updateData, { where: { id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await Kullanici.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
E *cascade08EE*cascade08Eû *cascade08ûƒ*cascade08ƒ‹ *cascade08‹£*cascade08£´ *cascade08´´*cascade08´ñ *cascade08
ñó ó÷*cascade08
÷   · *cascade08·û *cascade08ûş *cascade08şÿ*cascade08ÿ *cascade08„*cascade08„… *cascade08…˜*cascade08˜™ *cascade08™¶*cascade08¶· *cascade08·º*cascade08º» *cascade08»Ï*cascade08ÏĞ *cascade08ĞÑ*cascade08ÑÒ *cascade08ÒÕ*cascade08ÕÜ *cascade08Üà*cascade08àá *cascade08áâ*cascade08âä *cascade08äö *cascade08öø*cascade08øù *cascade08ùÿ*cascade08ÿ† *cascade08†ˆ*cascade08ˆ‰ *cascade08‰*cascade08š*cascade08š¤ *cascade08¤¨*cascade08¨« *cascade08«¬*cascade08¬° *cascade08°³*cascade08³´ *cascade08
´¸ ¸¼*cascade08
¼½ ½Æ *cascade08ÆÊ*cascade08Ê©	 *cascade08©	­	*cascade08­	á
 *cascade08á
â*cascade08âÒ *cascade08Ò˜*cascade08˜¶ *cascade082Sfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/controllers/UserController.js