�const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Dashboard kolonu ekleniyor...\n');

db.serialize(() => {
    // First check if column exists
    db.all("PRAGMA table_info(Settings)", [], (err, columns) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.close();
            process.exit(1);
        }

        const hasDashboard = columns.some(c => c.name === 'dashboard');

        if (hasDashboard) {
            console.log('✅ dashboard kolonu zaten mevcut');
            console.log('Kolonlar:', columns.map(c => c.name).join(', '));
            db.close();
            process.exit(0);
        } else {
            console.log('⚠️ dashboard kolonu yok, ekleniyor...');
            db.run('ALTER TABLE Settings ADD COLUMN dashboard TEXT', (alterErr) => {
                if (alterErr) {
                    console.error('❌ Kolon eklenemedi:', alterErr.message);
                    db.close();
                    process.exit(1);
                } else {
                    console.log('✅ dashboard kolonu başarıyla eklendi!');

                    // Verify
                    db.all("PRAGMA table_info(Settings)", [], (err2, cols2) => {
                        if (!err2) {
                            console.log('Yeni kolonlar:', cols2.map(c => c.name).join(', '));
                        }
                        db.close();
                        process.exit(0);
                    });
                }
            });
        }
    });
});
�*cascade082Efile:///c:/Users/Emmi/Documents/ekspertiz-node/add-dashboard-final.js