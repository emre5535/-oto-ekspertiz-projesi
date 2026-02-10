Ùconst express = require('express');
const path = require('path');
const cors = require('cors');
const sequelize = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 5000;

const compression = require('compression');

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files from parent public folder

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/', apiRoutes);
app.use('/api', apiRoutes); // Alias for compatibility with /api prefixed calls

// Fallback for SPA (if we had client-side routing, but we use strict html files for now)
// app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

// Database & Start
async function startServer() {
    try {
        console.log("â³ VeritabanÄ± senkronizasyonu baÅŸlÄ±yor...");
        await sequelize.sync({ alter: false });
        console.log("âœ… VeritabanÄ± senkronize edildi.");

        // Run Seed
        const seedUsers = require('./seed');
        await seedUsers();

        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`ğŸš€ Ekspertiz Sistemi V2 http://localhost:${PORT} adresinde yayÄ±nda!`);
        });

        server.on('error', (e) => console.error("Server Error:", e));
    } catch (err) {
        console.error("âŒ Sunucu baÅŸlatÄ±lamadÄ±:", err);
    }
}

startServer();
ğ *cascade08ğŸ*cascade08Ÿ¬ *cascade08¬Å*cascade08Å’ *cascade08’ã*cascade08ãÂ *cascade08ÂË *cascade08ËÏ*cascade08ÏÒ *cascade08Òİ *cascade08İŞ *cascade08Şæ*cascade08æç *cascade08çğ*cascade08ğò *cascade08òú*cascade08úû *cascade08ûÿ*cascade08ÿ€	 *cascade08€	„	*cascade08„	†	 *cascade08†		*cascade08		 *cascade08	›	*cascade08›	Ÿ	 *cascade08Ÿ	 	*cascade08 	¡	 *cascade08¡	¢	*cascade08¢	¦	 *cascade08¦	§	*cascade08§	±	 *cascade08±	µ	*cascade08µ	¹	 *cascade08¹	Å	*cascade08Å	È	 *cascade08È	É	*cascade08É	Ê	 *cascade08Ê	Ì	*cascade08Ì	Í	 *cascade08Í	Î	*cascade08Î	Ï	 *cascade08Ï	Ó	*cascade08Ó	à	 *cascade08à	á	*cascade08á	â	 *cascade08â	ä	*cascade08ä	è	 *cascade08è	ë	*cascade08ë	ì	 *cascade08ì	ï	*cascade08ï	Ù *cascade082?file:///c:/Users/Emmi/Documents/ekspertiz-node/server/server.js