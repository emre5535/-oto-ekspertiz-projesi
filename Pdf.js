Ñconst { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pdf = sequelize.define('Pdf', {
    originalName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    uploadedBy: {
        type: DataTypes.STRING,
        allowNull: true // Optional: stores info about who uploaded
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '2.El Tarih GÃ¼ncelleme' // Default for existing/migrated files
    }
}, {
    tableName: 'pdfs',
    timestamps: true
});

module.exports = Pdf;
Ò *cascade08Òý*cascade08ýÑ *cascade082Cfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/models/Pdf.js