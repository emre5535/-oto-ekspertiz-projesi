Ç5const carSchemas = {
    "Sedan": {
        // SOL YAN
        "sol_on_camurluk": "M45,90 Q80,20 160,35 L160,110 L94,110 Q94,80 66,80 Q38,80 38,110 L10,110 Q10,100 45,90",
        "sol_on_kapi": "M160,35 L280,35 L280,100 L160,100 L160,35", // Shortened bottom for marspiyel
        "sol_arka_kapi": "M280,35 L380,38 Q390,70 385,100 L280,100 L280,35", // Shortened bottom
        "sol_arka_camurluk": "M380,38 Q460,45 470,95 L470,110 L432,110 Q432,80 404,80 Q376,80 376,110 L385,110 L385,100 L380,38",

        "sol_marspiyel": "M160,100 L385,100 L385,115 L160,115 L160,100", // New Marspiyel
        "sol_a_diregi": "M140,35 L160,35 L160,10 L120,20 L140,35", // Approx A-Pillar (Top of fender/door)
        "sol_b_diregi": "M275,35 L285,35 L285,10 L275,10 L275,35", // Approx B-Pillar (Between doors)

        // SAG YAN (Mirrored)
        "sag_on_camurluk": "M45,90 Q80,20 160,35 L160,110 L94,110 Q94,80 66,80 Q38,80 38,110 L10,110 Q10,100 45,90",
        "sag_on_kapi": "M160,35 L280,35 L280,100 L160,100 L160,35",
        "sag_arka_kapi": "M280,35 L380,38 Q390,70 385,100 L280,100 L280,35",
        "sag_arka_camurluk": "M380,38 Q460,45 470,95 L470,110 L432,110 Q432,80 404,80 Q376,80 376,110 L385,110 L385,100 L380,38",

        "sag_marspiyel": "M160,100 L385,100 L385,115 L160,115 L160,100",
        "sag_a_diregi": "M140,35 L160,35 L160,10 L120,20 L140,35",
        "sag_b_diregi": "M275,35 L285,35 L285,10 L275,10 L275,35",

        // TAVAN / KAPUT / BAGAJ / CAMLAR
        "kaput": "M80,20 Q150,5 220,20 L240,100 L60,100 L80,20",
        "on_cam": "M80,20 L220,20 L230,-10 L70,-10 L80,20", // Above hood, below roof (visual approximation)
        "tavan": "M70,-10 L230,-10 L230,-90 L70,-90 L70,-10", // Shifted up for visual layout (Top view logic)
        "arka_cam": "M70,-90 L230,-90 L220,-120 L80,-120 L70,-90", // Above roof
        "bagaj": "M70,220 L230,220 L210,280 Q150,290 90,280 L70,220", // Keeping existing bagaj pos for now or shifting? 
        // Note: the original layout had tavan at 100-220. Let's adjust to be realistic logic.
        // Original: Kaput 20-100. Tavan 100-220. Bagaj 220-280.
        // Insert On_Cam between Kaput and Tavan.
        // New: Kaput 60-140. On_Cam 40-60. Tavan -60 to 40. Arka_Cam -80 to -60. Bagaj -140 to -80?
        // Let's keep it simple and just overlay or slight shifts.
        // Let's stick to the user's list IDs but map them to "Top View" group.

        // REVISING TOP VIEW COORDINATES for better flow:
        // Front (Bottom of screen in top view?) -> usually Hood is bottom or top.
        // Current: Kaput Y=20 to 100. Tavan 100 to 220. Bagaj 220 to 280. This is Top-Down (Front is top Y=0).
        // Let's insert Glass.
        // Kaput: 20-90.
        // On_Cam: 90-110.
        // Tavan: 110-200.
        // Arka_Cam: 200-220.
        // Bagaj: 220-280.

        "kaput": "M80,20 Q150,5 220,20 L240,90 L60,90 L80,20",
        "on_cam": "M60,90 L240,90 L235,115 L65,115 L60,90",
        "tavan": "M65,115 L235,115 L230,205 L70,205 L65,115",
        "arka_cam": "M70,205 L230,205 L225,225 L75,225 L70,205",
        "bagaj": "M75,225 L225,225 L210,280 Q150,290 90,280 L75,225",

        // TAMPONLAR
        "on_tampon": "M40,90 Q150,-10 260,90 L240,100 Q150,10 60,100 L40,90",
        "arka_tampon": "M90,280 Q150,300 210,280 L230,290 Q150,320 70,290 L90,280",

        // Transforms (Manual Adjustments for visuals)
        "sol_on_camurluk_transform": { x: 0, y: 0 },
        "sol_on_kapi_transform": { x: -115, y: 75 },
        "sol_arka_kapi_transform": { x: -115, y: 75 },
        "sol_arka_camurluk_transform": { x: -115, y: 75 },
        "sol_marspiyel_transform": { x: -115, y: 75 }, // Matches door shift
        "sol_a_diregi_transform": { x: -115, y: 75 },
        "sol_b_diregi_transform": { x: -115, y: 75 },

        "sag_on_camurluk_transform": { x: 300, y: 0, sx: -1, sy: 1 },
        "sag_on_kapi_transform": { x: 415, y: 75, sx: -1, sy: 1 },
        "sag_arka_kapi_transform": { x: 415, y: 75, sx: -1, sy: 1 },
        "sag_arka_camurluk_transform": { x: 415, y: 75, sx: -1, sy: 1 },
        "sag_marspiyel_transform": { x: 415, y: 75, sx: -1, sy: 1 },
        "sag_a_diregi_transform": { x: 415, y: 75, sx: -1, sy: 1 },
        "sag_b_diregi_transform": { x: 415, y: 75, sx: -1, sy: 1 }
    },
    "Hatchback": {
        "sol_on_camurluk": "M40,85 Q80,20 150,35 L150,110 L94,110 Q94,80 66,80 Q38,80 38,110 L10,110 Q10,100 40,85",
        "sol_on_kapi": "M150,35 L260,35 L260,110 L150,110 L150,35",
        "sol_arka_kapi": "M260,35 L340,38 Q350,70 345,110 L260,110 L260,35",
        "sol_arka_camurluk": "M340,38 Q400,45 410,95 L410,110 L380,110 Q380,80 350,80 Q330,80 330,110 L345,110 L345,110 L340,38",

        "sag_on_camurluk": "M40,85 Q80,20 150,35 L150,110 L94,110 Q94,80 66,80 Q38,80 38,110 L10,110 Q10,100 40,85",
        "sag_on_kapi": "M150,35 L260,35 L260,110 L150,110 L150,35",
        "sag_arka_kapi": "M260,35 L340,38 Q350,70 345,110 L260,110 L260,35",
        "sag_arka_camurluk": "M340,38 Q400,45 410,95 L410,110 L380,110 Q380,80 350,80 Q330,80 330,110 L345,110 L345,110 L340,38",

        "kaput": "M80,20 Q150,5 220,20 L240,100 L60,100 L80,20",
        "tavan": "M60,100 L240,100 L230,220 L70,220 L60,100",
        "bagaj": "M70,220 L230,220 L210,250 Q150,260 90,250 L70,220",

        "sol_on_camurluk_transform": { x: 0, y: 0 },
        "sag_on_camurluk_transform": { x: 300, y: 0, sx: -1, sy: 1 }
    },
    "SUV": {
        "sol_on_camurluk": "M40,90 Q80,10 160,30 L160,110 L94,110 Q94,80 66,80 Q38,80 38,110 L10,110 Q10,100 40,90",
        "sol_on_kapi": "M160,30 L280,30 L280,110 L160,110 L160,30",
        "sol_arka_kapi": "M280,30 L380,33 Q390,70 385,110 L280,110 L280,30",
        "sol_arka_camurluk": "M380,33 Q460,40 470,95 L470,110 L432,110 Q432,80 404,80 Q376,80 376,110 L385,110 L385,110 L380,33",
        "kaput": "M80,10 Q150,-5 220,10 L240,100 L60,100 L80,10",
        "tavan": "M60,100 L240,100 L230,230 L70,230 L60,100",
        "bagaj": "M70,230 L230,230 L210,280 Q150,290 90,280 L70,230"
    },
    "Panelvan": {
        "sol_on_camurluk": "M40,90 Q80,20 150,35 L150,110 L94,110 Q94,80 66,80 Q38,80 38,110 L10,110 Q10,100 40,90",
        "sol_on_kapi": "M150,35 L260,35 L260,110 L150,110 L150,35",
        "sol_arka_panel": "M260,35 L450,35 L450,110 L260,110 L260,35",
        "kaput": "M80,20 Q150,10 220,20 L240,100 L60,100 L80,20",
        "tavan": "M60,100 L240,100 L230,280 L70,280 L60,100",
        "bagaj": "M70,280 L230,280 L230,290 L70,290 L70,280" // Kamyonet kapagi gibi
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = carSchemas;
} else {
    window.carSchemas = carSchemas;
}
ﬁ *cascade08ﬁﬂ*cascade08ﬂÁ *cascade08ÁË*cascade08ËÛ *cascade08Ûï*cascade08ïŒ *cascade08Œœ*cascade08œÿ *cascade08ÿŸ*cascade08Ÿ„ *cascade08„˜*cascade08˜Ó *cascade08Óù*cascade08ùü *cascade08ü†*cascade08†§ *cascade08§ı*cascade08ı¯ *cascade08¯Ë*cascade08ËÈ *cascade08ÈÖ*cascade08Öá *cascade08á™*cascade08™∫ *cascade08∫ª*cascade08ªΩ *cascade08Ω¿*cascade08¿Ò *cascade08ÒÚ*cascade08Ú˙ *cascade08˙˚*cascade08˚ø *cascade08ø¿*cascade08¿» *cascade08»…*cascade08…À	 *cascade08À	ˆ	*cascade08ˆ	˜	 *cascade08˜	¸	*cascade08¸	Å
 *cascade08Å
¡
*cascade08¡
ƒ
 *cascade08ƒ
å*cascade08åç *cascade08ç©*cascade08©ª *cascade08ªƒ*cascade08ƒ≈ *cascade08≈œ*cascade08œÿ*cascade08ÿ• *cascade08•ì*cascade08ìù *cascade08ùû*cascade08û† *cascade08†°*cascade08°£ *cascade08£´*cascade08´Ø *cascade08Ø∞*cascade08∞≤ *cascade08≤√*cascade08√≈ *cascade08≈ï*cascade08ïú *cascade08ú°*cascade08°§ *cascade08§≤*cascade08≤∑ *cascade08∑‚*cascade08‚Á *cascade08ÁÈ*cascade08ÈÎ *cascade08ÎÒ*cascade08ÒÛ *cascade08Ûé*cascade08éë *cascade08ë≈*cascade08≈œ *cascade08œÑ*cascade08ÑÖ *cascade08Ö∆*cascade08∆« *cascade08«‚*cascade08‚Ê *cascade08Ê÷*cascade08÷€ *cascade08€Ú*cascade08Úˆ *cascade08ˆù*cascade08ùü *cascade08ü†*cascade08†ß *cascade08ßø*cascade08ø¡ *cascade08¡Ë*cascade08ËÑ *cascade08ÑÖ*cascade08Öà *cascade08àâ*cascade08âä *cascade08ä„ *cascade08„ü*cascade08üå  *cascade08å ‹!*cascade08‹!â" *cascade08â"Ø" *cascade08Ø"Ç5*cascade082Ffile:///c:/Users/Emmi/Documents/ekspertiz-node/public/js/carSchemas.js