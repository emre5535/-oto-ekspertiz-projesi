�
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Veritabanı bağlantısı kuruldu.');

// Drop and recreate Settings table
db.serialize(() => {
    // Drop backup tables
    db.run('DROP TABLE IF EXISTS Aracs_backup', (err) => {
        if (err) console.error('Backup cleanup:', err.message);
        else console.log('✅ Aracs_backup silindi.');
    });

    // Create Settings table if not exists
    db.run(`
        CREATE TABLE IF NOT EXISTS Settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form TEXT DEFAULT '{}',
            company TEXT,
            report TEXT,
            theme TEXT,
            modules TEXT,
            dashboard TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Settings table error:', err.message);
        } else {
            console.log('✅ Settings tablosu oluşturuldu/kontrol edildi.');
        }

        db.close(() => {
            console.log('Veritabanı bağlantısı kapatıldı.');
            process.exit(0);
        });
    });
});
�
*cascade082Dfile:///c:/Users/Emmi/Documents/ekspertiz-node/fix-settings-table.js