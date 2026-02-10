Úconst sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ekspertiz.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Checking table schema for Settings...");
    db.all("PRAGMA table_info(Settings)", (err, rows) => {
        if (err) {
            console.error("Error:", err);
            return;
        }
        console.log("Columns:", rows.map(r => r.name));

        const hasReport = rows.some(r => r.name === 'report');
        if (!hasReport) {
            console.log("Missing 'report' column! Adding it...");
            db.run("ALTER TABLE Settings ADD COLUMN report TEXT", (err) => {
                if (err) console.error("Failed to add column:", err);
                else console.log("Added 'report' column successfully.");
            });
        } else {
            console.log("'report' column exists.");
        }
    });
});

db.close();
Ú*cascade0828file:///c:/Users/Emmi/Documents/ekspertiz-node/fix-db.js