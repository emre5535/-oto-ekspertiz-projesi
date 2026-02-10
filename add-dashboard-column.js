îconst sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Add dashboard column to Settings table
db.run('ALTER TABLE Settings ADD COLUMN dashboard TEXT', (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('‚ùå Hata:', err.message);
        process.exit(1);
    }
    console.log('‚úÖ dashboard kolonu eklendi.');
    db.close();
    process.exit(0);
});
î*cascade082Ffile:///c:/Users/Emmi/Documents/ekspertiz-node/add-dashboard-column.js