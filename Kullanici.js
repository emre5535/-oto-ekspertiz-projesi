­const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kullanici = sequelize.define('Kullanici', {
    kullaniciAdi: { type: DataTypes.STRING, allowNull: false, unique: true },
    sifre: { type: DataTypes.STRING, allowNull: false },
    adSoyad: { type: DataTypes.STRING }, // Display name
    role: {
        type: DataTypes.STRING,
        defaultValue: 'Eksper' // 'Admin', 'Eksper', 'DanÄ±ÅŸman'
    },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }, // Legacy
    canDelete: { type: DataTypes.BOOLEAN, defaultValue: false },
    canEdit: { type: DataTypes.BOOLEAN, defaultValue: true }, // Can edit records
    canViewPrice: { type: DataTypes.BOOLEAN, defaultValue: true } // Can view price info
});

module.exports = Kullanici;
­*cascade082Ifile:///c:/Users/Emmi/Documents/ekspertiz-node/server/models/Kullanici.js