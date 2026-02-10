�const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Veritabanı bağlantısı kuruldu.');

db.serialize(() => {
    // Create Pdfs table
    db.run(`
        CREATE TABLE IF NOT EXISTS pdfs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            originalName TEXT NOT NULL,
            filename TEXT NOT NULL,
            path TEXT NOT NULL,
            size INTEGER,
            uploadedBy TEXT,
            category TEXT DEFAULT '2.El Tarih Güncelleme',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Pdfs table error:', err.message);
        } else {
            console.log('✅ Pdfs tablosu oluşturuldu/kontrol edildi.');
        }

        db.close(() => {
            console.log('Veritabanı bağlantısı kapatıldı.');
            process.exit(0);
        });
    });
});
�*cascade082Cfile:///c:/Users/Emmi/Documents/ekspertiz-node/create-pdfs-table.js