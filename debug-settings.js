°	const sequelize = require('./server/config/database');
const Settings = require('./server/models/Settings');

async function testSettings() {
    try {
        console.log("Connecting to database...");
        await sequelize.authenticate();
        console.log("Connection successful.");

        console.log("Syncing model...");
        await Settings.sync({ alter: true });
        console.log("Sync successful.");

        console.log("Fetching settings...");
        let settings = await Settings.findOne();
        if (!settings) {
            console.log("No settings found, creating default...");
            settings = await Settings.create({
                form: { brands: ["Test"], colors: ["Test"] },
                company: { name: "Test Co" }
            });
            console.log("Created settings.");
        } else {
            console.log("Settings found (ID: " + settings.id + ")");
            console.log("Form:", settings.form);
            console.log("Company:", settings.company);
        }

    } catch (error) {
        console.error("FATAL ERROR:", error);
    } finally {
        await sequelize.close();
    }
}

testSettings();
°	*cascade082@file:///c:/Users/Emmi/Documents/ekspertiz-node/debug-settings.js