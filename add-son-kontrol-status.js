”const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ekspertiz.sqlite');
const db = new sqlite3.Database(dbPath);

const column = { name: 'son_kontrol_status', type: 'INTEGER DEFAULT 0' };

db.serialize(() => {
    const sql = `ALTER TABLE Aracs ADD COLUMN ${column.name} ${column.type}`;
    db.run(sql, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log(`Column ${column.name} already exists.`);
            } else {
                console.error(`Error adding ${column.name}:`, err.message);
            }
        } else {
            console.log(`Column ${column.name} added successfully.`);
        }
    });
});

db.close();
”*cascade082Hfile:///c:/Users/Emmi/Documents/ekspertiz-node/add-son-kontrol-status.js