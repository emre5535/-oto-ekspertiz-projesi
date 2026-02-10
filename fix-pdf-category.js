�const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Veritabanı bağlantısı kuruldu.');

db.serialize(() => {
    // Add category column to pdfs table
    db.run('ALTER TABLE pdfs ADD COLUMN category TEXT DEFAULT "2.El Tarih Güncelleme"', (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Hata:', err.message);
            process.exit(1);
        }
        console.log('✅ category kolonu eklendi (pdfs).');

        db.close(() => {
            console.log('Veritabanı bağlantısı kapatıldı.');
            process.exit(0);
        });
    });
});
�*cascade082Bfile:///c:/Users/Emmi/Documents/ekspertiz-node/fix-pdf-category.js