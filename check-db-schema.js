úconst sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPaths = [
    path.join(__dirname, 'ekspertiz.sqlite'),
    path.join(__dirname, 'database.sqlite')
];

dbPaths.forEach(dbPath => {
    console.log(`\nChecking database at: ${dbPath}`);
    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
        // 1. Check Tables
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
                console.error("Error listing tables:", err);
                return;
            }
            if (!tables) { console.log("No tables found."); return; }
            console.log("Tables found:", tables.map(t => t.name));

            // 2. Check Columns of 'Kullanicis' (Sequelize default plural)
            const tableName = 'Kullanicis';
            db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                if (err) {
                    console.error(`Error getting columns for ${tableName}:`, err);
                } else if (columns.length === 0) {
                    console.log(`${tableName} empty or not found.`);
                } else {
                    console.log(`Columns in ${tableName}:`);
                    // Simplify output for readability
                    console.table(columns.map(c => ({ name: c.name, type: c.type, dflt: c.dflt_value })));
                }
                // Close inside the inner callback
                db.close();
            });
        });
    });
});
\ *cascade08\]*cascade08]_ *cascade08_f*cascade08fè *cascade08è¿*cascade08¿√ *cascade08√Ê*cascade08ÊÛ *cascade08Ûı*cascade08ıô *cascade08ôù*cascade08ù… *cascade08…Õ *cascade08Õ„ *cascade08„Á*cascade08ÁÉ *cascade08Éá*cascade08áﬂ *cascade08ﬂ„*cascade08„Ô *cascade08ÔÛ*cascade08Û≠ *cascade08≠∞*cascade08∞º *cascade08ºΩ*cascade08ΩŒ *cascade08Œ“*cascade08“’ *cascade08’ú*cascade08úü*cascade08üß *cascade08ß®*cascade08®‚ *cascade08‚Ê*cascade08ÊÆ *cascade08Æ±*cascade08±π *cascade08π∫*cascade08∫€ *cascade08€ﬁ*cascade08ﬁÊ *cascade08ÊÁ*cascade08Á≤ *cascade08≤∂*cascade08∂¬ *cascade08¬ƒ*cascade08ƒ‘ *cascade08‘÷*cascade08÷¶ *cascade08¶ß*cascade08ß® *cascade08®´*cascade08´  *cascade08 À*cascade08À€ *cascade08€ﬁ*cascade08ﬁú	 *cascade08ú	†	*cascade08†	™	 *cascade08™	≠	*cascade08≠	Ω	 *cascade08Ω	æ	*cascade08æ	Ë	 *cascade08Ë	†
*cascade08†
§
*cascade08§
…
 *cascade08…
à*cascade08àò *cascade08òú*cascade08úü *cascade08ü”*cascade08”◊*cascade08◊ﬂ *cascade08ﬂÏ*cascade08Ï˝*cascade08˝Å *cascade08ÅÉ*cascade08Éá *cascade08áâ*cascade08âé *cascade08éí*cascade08íí*cascade08íì*cascade08ìó *cascade08óú*cascade082Afile:///c:/Users/Emmi/Documents/ekspertiz-node/check-db-schema.js