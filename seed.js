�const Kullanici = require('./models/Kullanici');

async function seedUsers() {
    try {
        // Seed Admin
        const admin = await Kullanici.findOne({ where: { kullaniciAdi: 'admin' } });
        if (!admin) {
            await Kullanici.create({
                kullaniciAdi: 'admin',
                sifre: 'admin123',
                role: 'Admin',
                adSoyad: 'Sistem Yöneticisi',
                canDelete: true,
                isAdmin: true
            });
            console.log("✅ Admin kullanıcısı oluşturuldu.");
        }

        // Seed Serhat
        const serhat = await Kullanici.findOne({ where: { kullaniciAdi: 'serhat' } });
        if (!serhat) {
            await Kullanici.create({
                kullaniciAdi: 'serhat',
                sifre: 'serhat123',
                role: 'Danışman',
                adSoyad: 'Serhat',
                canDelete: true
            });
            console.log("✅ Serhat kullanıcısı oluşturuldu.");
        }

        // Seed Emre
        const emre = await Kullanici.findOne({ where: { kullaniciAdi: 'emre' } });
        if (!emre) {
            await Kullanici.create({
                kullaniciAdi: 'emre',
                sifre: 'emre123',
                role: 'Danışman',
                adSoyad: 'Emre',
                canDelete: true
            });
            console.log("✅ Emre kullanıcısı oluşturuldu.");
        }
    } catch (error) {
        console.error("❌ Seeding Hatası:", error);
    }
}

module.exports = seedUsers;
�*cascade082=file:///c:/Users/Emmi/Documents/ekspertiz-node/server/seed.js