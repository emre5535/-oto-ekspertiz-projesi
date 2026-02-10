ˆconst sequelize = require('../server/config/database');
const Pdf = require('../server/models/Pdf');

async function sync() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        await Pdf.sync({ alter: true });
        console.log('Pdf table synced successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

sync();
ˆ*cascade082Bfile:///c:/Users/Emmi/Documents/ekspertiz-node/scripts/sync-pdf.js