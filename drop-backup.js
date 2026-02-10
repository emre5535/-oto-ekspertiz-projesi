¯const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.run('DROP TABLE IF EXISTS Aracs_backup', (err) => {
    if (err) {
        console.error('Hata:', err.message);
        process.exit(1);
    }
    console.log('âœ… Aracs_backup tablosu silindi.');
    db.close();
    process.exit(0);
});
¯*cascade082=file:///c:/Users/Emmi/Documents/ekspertiz-node/drop-backup.js