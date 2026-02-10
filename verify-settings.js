�const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Veritabanı bağlantısı kuruldu.');

db.serialize(() => {
    // Check if Settings table exists and has dashboard column
    db.all("PRAGMA table_info(Settings)", [], (err, columns) => {
        if (err) {
            console.error('❌ Settings table check error:', err.message);
            process.exit(1);
        }

        console.log('Settings Table Columns:', columns.map(c => c.name));

        const hasDashboard = columns.some(c => c.name === 'dashboard');

        if (!hasDashboard) {
            console.log('⚠️ dashboard column missing, adding it...');
            db.run('ALTER TABLE Settings ADD COLUMN dashboard TEXT', (err2) => {
                if (err2) {
                    console.error('❌ Failed to add dashboard:', err2.message);
                } else {
                    console.log('✅ dashboard column added');
                }
                checkAndInsertDefault();
            });
        } else {
            console.log('✅ dashboard column exists');
            checkAndInsertDefault();
        }
    });
});

function checkAndInsertDefault() {
    // Check if any settings exist
    db.get('SELECT COUNT(*) as count FROM Settings', [], (err, row) => {
        if (err) {
            console.error('❌ Count error:', err.message);
            db.close();
            process.exit(1);
        }

        if (row.count === 0) {
            console.log('⚠️ No settings found, inserting default...');
            db.run(`
                INSERT INTO Settings (form, company, report, theme, modules, dashboard, createdAt, updatedAt)
                VALUES ('{}', '{}', '{}', '{}', '{}', NULL, datetime('now'), datetime('now'))
            `, (insertErr) => {
                if (insertErr) {
                    console.error('❌ Insert error:', insertErr.message);
                } else {
                    console.log('✅ Default settings inserted');
                }
                db.close();
                process.exit(0);
            });
        } else {
            console.log(`✅ Settings table has ${row.count} row(s)`);
            db.close();
            process.exit(0);
        }
    });
}
�*cascade082Afile:///c:/Users/Emmi/Documents/ekspertiz-node/verify-settings.js