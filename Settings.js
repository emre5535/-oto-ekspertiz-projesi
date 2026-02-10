¯const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
    form: {
        type: DataTypes.TEXT, // Storing JSON as TEXT for SQLite compatibility/simplicity
        allowNull: false,
        defaultValue: '{}',
        get() {
            const raw = this.getDataValue('form');
            try {
                return JSON.parse(raw);
            } catch (e) {
                return { brands: [], colors: [], packages: [] };
            }
        },
        set(val) {
            this.setDataValue('form', JSON.stringify(val));
        }
    },
    company: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('company');
            try {
                return raw ? JSON.parse(raw) : {};
            } catch (e) {
                return {};
            }
        },
        set(val) {
            this.setDataValue('company', JSON.stringify(val));
        }
    },
    report: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('report');
            try {
                return raw ? JSON.parse(raw) : { title: "Ekspertiz Raporu", showPrice: false };
            } catch (e) {
                return { title: "Ekspertiz Raporu", showPrice: false };
            }
        },
        set(val) {
            this.setDataValue('report', JSON.stringify(val));
        }
    },
    theme: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() { return JSON.parse(this.getDataValue('theme') || '{}') },
        set(val) { this.setDataValue('theme', JSON.stringify(val)) }
    },
    modules: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() { return JSON.parse(this.getDataValue('modules') || '{}') },
        set(val) { this.setDataValue('modules', JSON.stringify(val)) }
    },
    dashboard: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('dashboard');
            return raw ? JSON.parse(raw) : null;
        },
        set(val) { this.setDataValue('dashboard', JSON.stringify(val)) }
    }
}, {
    timestamps: true
});

module.exports = Settings;
¯*cascade082Hfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/models/Settings.js