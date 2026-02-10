�const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// CORRECT DATABASE FILE!
const dbPath = path.join(__dirname, 'ekspertiz.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== DOĞRU VERİTABANI DOSYASI: ekspertiz.sqlite ===\n');

db.serialize(() => {
    // Check Settings table structure
    db.all("PRAGMA table_info(Settings)", [], (err, columns) => {
        if (err) {
            console.error('❌ Settings table yok:', err.message);
            db.close();
            process.exit(1);
        }

        console.log('Mevcut kolonlar:', columns.map(c => c.name).join(', '));
        const hasDashboard = columns.some(c => c.name === 'dashboard');

        if (hasDashboard) {
            console.log('✅ dashboard kolonu zaten mevcut');
            db.close();
            process.exit(0);
        } else {
            console.log('⚠️ dashboard kolonu eksik, ekleniyor...\n');
            db.run('ALTER TABLE Settings ADD COLUMN dashboard TEXT', (alterErr) => {
                if (alterErr) {
                    console.error('❌ Hata:', alterErr.message);
                    db.close();
                    process.exit(1);
                } else {
                    console.log('✅ dashboard kolonu başarıyla eklendi!');

                    // Verify
                    db.all("PRAGMA table_info(Settings)", [], (err2, cols2) => {
                        console.log('YENİ kolonlar:', cols2.map(c => c.name).join(', '));
                        db.close();
                        process.exit(0);
                    });
                }
            });
        }
    });
});
�*cascade082Cfile:///c:/Users/Emmi/Documents/ekspertiz-node/fix-real-database.js