�const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// CORRECT DATABASE FILE: ekspertiz.sqlite
const dbPath = path.join(__dirname, 'ekspertiz.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== PDF TABLOSU DÜZELTME (ekspertiz.sqlite) ===\n');

db.serialize(() => {
    // 1. Pdfs table check for 'category'
    db.all("PRAGMA table_info(pdfs)", [], (err, columns) => {
        if (err) {
            console.error('❌ Pdfs tablosu okunamadı:', err.message);
            // If table doesn't exist, we might need to create it, but error suggests "no such column", so table likely exists.
            if (err.message.includes('no such table')) {
                console.log('⚠️ Tablo yok, oluşturuluyor...');
                createIt();
            } else {
                db.close();
                process.exit(1);
            }
            return;
        }

        const hasCategory = columns.some(c => c.name === 'category');

        if (hasCategory) {
            console.log('✅ category kolonu zaten mevcut.');
        } else {
            console.log('⚠️ category kolonu eksik, ekleniyor...');
            db.run("ALTER TABLE pdfs ADD COLUMN category TEXT DEFAULT '2.El Tarih Güncelleme'", (alterErr) => {
                if (alterErr) {
                    console.error('❌ Kolon eklenemedi:', alterErr.message);
                } else {
                    console.log('✅ category kolonu başarıyla eklendi!');
                }
            });
        }
    });

    // 2. Settings table check (Double check)
    db.all("PRAGMA table_info(Settings)", [], (err, columns) => {
        if (!err) {
            const hasDashboard = columns.some(c => c.name === 'dashboard');
            if (!hasDashboard) {
                console.log('⚠️ Settings dashboard kolonu eksik (tekrar kontrol), ekleniyor...');
                db.run('ALTER TABLE Settings ADD COLUMN dashboard TEXT');
            } else {
                console.log('✅ Settings dashboard kolonu mevcut.');
            }
        }

        // Finalize
        setTimeout(() => {
            db.close(() => {
                console.log('\n=== İŞLEM TAMAMLANDI ===');
                process.exit(0);
            });
        }, 1000);
    });
});

function createIt() {
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
        if (err) console.error(err);
        else console.log('✅ Pdfs tablosu oluşturuldu.');
    });
}
�*cascade082>file:///c:/Users/Emmi/Documents/ekspertiz-node/fix-db-final.js