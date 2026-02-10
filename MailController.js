�const Arac = require('../models/Arac');
const ExcelJS = require('exceljs');

exports.generateTakasExcel = async (req, res) => {
    try {
        const { vehicles } = req.body; // Array of { id, takas_testigi, yeni_fiyat }

        if (!vehicles || vehicles.length === 0) {
            return res.status(400).json({ success: false, error: 'Araç listesi gerekli' });
        }

        // Fetch vehicle data
        const vehicleIds = vehicles.map(v => v.id);
        const cars = await Arac.findAll({
            where: {
                [Arac.rawAttributes.plaka ? 'plaka' : 'id']: vehicleIds
            }
        });

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Takas Listesi');

        // Define columns based on the screenshot
        worksheet.columns = [
            { header: 'ALIŞ TARİHİ', key: 'alis_tarihi', width: 12 },
            { header: 'PLAKA', key: 'plaka', width: 12 },
            { header: 'MARKA', key: 'marka', width: 15 },
            { header: 'MODEL', key: 'model', width: 15 },
            { header: 'MODEL YILI', key: 'model_yil', width: 12 },
            { header: 'FATURA KESECEK Mİ', key: 'fatura_kesecek', width: 18 },
            { header: 'TAKAS TEŞVİĞİ VAR MI', key: 'takas_tesvigi', width: 18 },
            { header: 'YENİ FİYAT', key: 'yeni_fiyat', width: 12 },
            { header: 'ALIŞ TUTARI', key: 'alis_tutari', width: 12 },
            { header: 'DANIŞMAN', key: 'danisman', width: 15 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Add data
        vehicles.forEach(vehicleData => {
            const car = cars.find(c => (c.plaka || c.id) == vehicleData.id);
            if (!car) return;

            worksheet.addRow({
                alis_tarihi: car.createdAt ? new Date(car.createdAt).toLocaleDateString('tr-TR') : '',
                plaka: car.plaka || '',
                marka: car.marka || '',
                model: car.model || '',
                model_yil: car.yil || '',
                fatura_kesecek: car.fatura ? 'EVET' : 'HAYIR',
                takas_tesvigi: vehicleData.takas_testigi || 'Hayır',
                yeni_fiyat: vehicleData.yeni_fiyat || car.fiyat_sat || '',
                alis_tutari: car.fiyat_alim || '',
                danisman: car.talep_eden || ''
            });
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send as download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Takas_Listesi_${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(buffer);

    } catch (error) {
        console.error('Takas Excel Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
�*cascade082Sfile:///c:/Users/Emmi/Documents/ekspertiz-node/server/controllers/MailController.js