Žconst { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Arac = sequelize.define('Arac', {
    plaka: { type: DataTypes.STRING, allowNull: false, unique: true },
    marka: DataTypes.STRING,
    model: DataTypes.STRING, // New field based on recent updates
    yil: DataTypes.INTEGER,
    km: DataTypes.INTEGER,
    sasi: DataTypes.STRING,
    motor: DataTypes.STRING, // New
    renk: DataTypes.STRING,  // New
    yakit: DataTypes.STRING, // New
    vites: DataTypes.STRING, // New
    cc: DataTypes.STRING, // Engine Volume
    kw: DataTypes.STRING, // Engine Power
    tramer: DataTypes.TEXT, // Tramer Info
    belge_tipi: DataTypes.STRING, // 'Son Kontrol', 'Tescil', 'Fatura' etc. (or JSON array if multiple?)
    // Let's use separate booleans or a string for "Son Kontrol"
    son_kontrol: { type: DataTypes.BOOLEAN, defaultValue: false },
    son_kontrol_status: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0:Pending, 1:Pass, 2:Fail
    tescil: { type: DataTypes.BOOLEAN, defaultValue: false },
    fatura: { type: DataTypes.BOOLEAN, defaultValue: false },
    musteri_adi: DataTypes.STRING, // Kept for legacy compatibility, though we use ruhsat_sahibi now
    ruhsat_sahibi: DataTypes.STRING, // New preferred field
    telefon: DataTypes.STRING,
    aciklama: DataTypes.TEXT,
    dosyalar: {
        type: DataTypes.TEXT,
        get() {
            const raw = this.getDataValue('dosyalar');
            return raw ? JSON.parse(raw) : [];
        },
        set(val) {
            this.setDataValue('dosyalar', JSON.stringify(val));
        }
    },
    kaporta: {
        type: DataTypes.TEXT,
        get() {
            const raw = this.getDataValue('kaporta');
            return raw ? JSON.parse(raw) : {};
        },
        set(val) {
            this.setDataValue('kaporta', JSON.stringify(val));
        }
    },
    fiyat_alim: DataTypes.FLOAT,
    fiyat_sat: DataTypes.FLOAT,
    durum: { type: DataTypes.STRING, defaultValue: 'Bekliyor' },
    eksper_sorumlusu: DataTypes.STRING, // Expert name
    raporu_hazirlayan: DataTypes.STRING,
    talep_eden: DataTypes.STRING, // Advisor Name/ID
    fiyatlandirildi: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = Arac;
Ž*cascade082Dfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/models/Arac.js