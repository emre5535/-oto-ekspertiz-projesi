Üconst sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ekspertiz.sqlite');
const db = new sqlite3.Database(dbPath);

const columnsToAdd = [
    { name: 'canDelete', type: 'BOOLEAN DEFAULT 0' },
    { name: 'canEdit', type: 'BOOLEAN DEFAULT 1' },
    { name: 'canViewPrice', type: 'BOOLEAN DEFAULT 1' }
];

db.serialize(() => {
    columnsToAdd.forEach(col => {
        const sql = `ALTER TABLE Kullanicis ADD COLUMN ${col.name} ${col.type}`;
        db.run(sql, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    console.error(`Error adding ${col.name}:`, err.message);
                }
            } else {
                console.log(`Column ${col.name} added successfully.`);
            }
        });
    });
});

db.close();
u *cascade08uw*cascade08wx *cascade08xy*cascade08yz *cascade08z~*cascade08~Ü *cascade082@file:///c:/Users/Emmi/Documents/ekspertiz-node/fix-db-columns.js