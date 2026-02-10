�const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== VERİTABANI DURUM KONTROL ===\n');

db.serialize(() => {
    // 1. Settings tablosu kontrolü
    db.get('SELECT COUNT(*) as count FROM Settings', [], (err, row) => {
        if (err) {
            console.error('❌ Settings table error:', err.message);
        } else {
            console.log(`✅ Settings: ${row.count} kayıt var`);
        }
    });

    // 2. Settings veri kontrolü
    db.all('SELECT * FROM Settings LIMIT 1', [], (err, rows) => {
        if (err) {
            console.error('❌ Settings data error:', err.message);
        } else if (rows.length > 0) {
            console.log('✅ Settings içeriği:', JSON.stringify(rows[0], null, 2));
        } else {
            console.log('⚠️ Settings tablosu boş!');
        }
    });

    // 3. Pdfs tablosu kontrolü
    db.get('SELECT COUNT(*) as count FROM pdfs', [], (err, row) => {
        if (err) {
            console.error('❌ Pdfs table error:', err.message);
        } else {
            console.log(`✅ Pdfs: ${row.count} kayıt var`);
        }
    });

    // 4. Users tablosu kontrolü
    db.get('SELECT COUNT(*) as count FROM Kullanicilars', [], (err, row) => {
        if (err) {
            console.error('❌ Users table error:', err.message);
        } else {
            console.log(`✅ Kullanıcılar: ${row.count} kayıt var`);
        }

        db.close(() => {
            console.log('\n=== KONTROL TAMAMLANDI ===');
            process.exit(0);
        });
    });
});
�*cascade082Afile:///c:/Users/Emmi/Documents/ekspertiz-node/check-db-status.js