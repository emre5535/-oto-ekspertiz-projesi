Ğ†
document.addEventListener('DOMContentLoaded', () => {
    // Schema Loading
    if (typeof loadSchemasFromServer === 'function') loadSchemasFromServer();

    // CHECK URL FOR EDIT MODE
    const urlParams = new URLSearchParams(window.location.search);
    const editPlaka = urlParams.get('plaka') || urlParams.get('id');
    if (editPlaka) {
        loadReportForEditing(editPlaka);
    }

    // Check Admin for Edit Button
    try {
        const uStr = localStorage.getItem('user');
        const u = uStr ? JSON.parse(uStr) : null;
        const role = (u && (u.role || u.rol || '')) || 'Misafir';
        const lowerRole = role.toLowerCase();
        const isAdmin = (u && !!u.isAdmin) || (lowerRole === 'admin') || (u && u.kullaniciAdi === 'admin');

        const btn = document.createElement('button');
        btn.id = 'btnToggleEdit';
        btn.className = 'btn btn-sm ' + (isAdmin ? 'btn-outline' : 'btn-outline');
        btn.style.marginLeft = '10px';

        if (isAdmin) {
            btn.innerHTML = '<i class="fas fa-tools"></i> YÃ¶netici DÃ¼zenleme';
            btn.onclick = toggleSchemaEditMode;
        } else {
            btn.innerHTML = '<i class="fas fa-lock"></i> YÃ¶netici (Kilitli)';
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.title = "Admin yetkisi gerekir.";
        }

        const container = document.getElementById('schemaTools');
        if (container) {
            // Remove existing Edit button if any
            const existing = document.getElementById('btnToggleEdit');
            if (existing) existing.remove();

            // Prepend or Append? Append is safer for layout.
            // But we want Voice button to be visible too.
            container.appendChild(btn);
        }
    } catch (e) { console.error(e); }

    // Init Visuals
    if (typeof loadVisuals === 'function') loadVisuals('Sedan');

    // Init Forms
    loadAdvisors();
    if (typeof initContextMenu === 'function') initContextMenu();
    // Wait, initContextMenu is usually in car-render or logic? 
    // In previous steps, I moved context menu logic (togglePart) to car-render, 
    // but the EVENT LISTENER attachment was in loadVisuals (attachNormalEvents).
    // So initContextMenu might be redundant if loadVisuals attaches events!
    // Let's verify. Yes, attachNormalEvents adds oncontextmenu. 
    // But there is also a global listener for clicking outside. 
    // And duplicate listeners on parts?
    // loadVisuals creates new parts, so direct listeners are best.
    // The "initContextMenu" function in previous code iterated over static .car-parts, 
    // but we build them dynamically now. So initContextMenu is likely obsolete.

    // Global Click for Context Menu Close
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('contextMenu');
        if (menu && !e.target.closest('.context-menu') && !e.target.closest('.car-part')) {
            menu.style.display = 'none';
        }
    });

    // Drag Drop
    const dz = document.getElementById('dropZone');
    if (dz) {
        dz.addEventListener('click', () => document.getElementById('ocrInput').click());
        dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.background = '#eef2ff'; });
        dz.addEventListener('dragleave', (e) => { e.preventDefault(); dz.style.background = '#f8fafc'; });
    }

    // Monitors for Unsaved Changes
    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', () => { if (typeof window.isDirty !== 'undefined') window.isDirty = true; });
        el.addEventListener('change', () => { if (typeof window.isDirty !== 'undefined') window.isDirty = true; });
    });

    // Part Photo Logic REMOVED per user request
});

// WIZARD NAV


// WIZARD NAV
function setStep(n) {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step-${n}`).classList.remove('hidden');

    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${n}-btn`).classList.add('active');
}

async function loadAdvisors() {
    try {
        const users = await apiRequest('kullanicilar');
        if (!Array.isArray(users)) return;

        // Populate danismanSelect (advisor dropdown)
        const danismanSelect = document.getElementById('danismanSelect');
        if (danismanSelect) {
            danismanSelect.innerHTML = '<option value="">SeÃ§iniz...</option>';
            users.forEach(user => {
                const opt = document.createElement('option');
                opt.value = user.adSoyad;
                opt.innerText = user.adSoyad;
                danismanSelect.appendChild(opt);
            });

            // Set current user as default
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) danismanSelect.value = currentUser.adSoyad;
        }

        // Also populate talepEden if it exists (for compatibility)
        const talepEdenSelect = document.getElementById('talepEden');
        if (talepEdenSelect) {
            talepEdenSelect.innerHTML = '<option value="">SeÃ§iniz...</option>';
            users.forEach(user => {
                const opt = document.createElement('option');
                opt.value = user.adSoyad;
                opt.innerText = user.adSoyad;
                talepEdenSelect.appendChild(opt);
            });

            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) talepEdenSelect.value = currentUser.adSoyad;
        }
    } catch (e) {
        console.error("Advisors load error", e);
    }
}

async function performOCR(file) {
    if (!file) return;
    document.getElementById('ocrLoader').classList.remove('hidden');

    const fd = new FormData();
    fd.append('ruhsat', file);

    try {
        const res = await fetch('/ocr', { method: 'POST', body: fd });
        const json = await res.json();

        if (json.basarili) {
            const v = json.veri;
            const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };

            setVal('plaka', v.plaka);
            setVal('marka', v.marka);
            setVal('model', v.model);
            setVal('yil', v.yil);
            setVal('sasi', v.sasi);
            setVal('motor', v.motor);
            setVal('renk', v.renk);
            setVal('adSoyad', v.ad_soyad);

            if (v.yakit) document.getElementById('yakitSelect').value = v.yakit;
            if (v.vites) document.getElementById('vitesSelect').value = v.vites;
            if (v.kasa_tipi) {
                document.getElementById('kasaSelect').value = v.kasa_tipi;
                if (typeof loadVisuals === 'function') loadVisuals(v.kasa_tipi);
            }

            showToast("Bilgiler baÅŸarÄ±yla okundu!", "success");
        } else {
            showToast("OCR HatasÄ±: " + json.hata, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast("BaÄŸlantÄ± HatasÄ±", 'error');
    } finally {
        document.getElementById('ocrLoader').classList.add('hidden');
    }
}

function sendSms5664() {
    const plaka = document.getElementById('plaka').value;
    if (!plaka) return showToast("Ã–nce plakayÄ± giriniz.", "error");

    const cleanPlate = plaka.replace(/\s+/g, '').toUpperCase();
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const sep = isIOS ? '&' : '?';

    window.location.href = `sms:5664${sep}body=${cleanPlate}`;
}

/* --- VALUATION (AI/MOCK) --- */
function calculateEstimatedValue() {
    const marka = document.getElementById('marka').value;
    const model = document.getElementById('model').value;
    const yil = parseInt(document.getElementById('yil').value) || 2020;
    const km = parseInt(document.getElementById('km').value) || 50000;
    const paket = document.getElementById('paket') ? document.getElementById('paket').value : '';
    const vites = document.getElementById('vitesSelect').value;
    const yakit = document.getElementById('yakitSelect').value;
    const tramer = parseInt(document.getElementById('tramer').value) || 0;

    if (!marka || !model) return showToast("Marka ve Model giriniz.", "error");

    // 1. Base Price Logic
    let basePrice = 900000; // Starting base

    // Year Factor
    const currentYear = new Date().getFullYear();
    const age = currentYear - yil;
    basePrice -= (age * 60000); // Newer is better

    // KM Factor
    basePrice -= (km * 0.8);

    // 2. Options Multipliers
    if (vites === 'Otomatik') basePrice *= 1.10; // +10%
    if (yakit === 'Dizel') basePrice *= 1.05;
    if (yakit === 'Hibrit') basePrice *= 1.15;

    // Package Factor (Simple check)
    if (paket.toLowerCase().includes('titanium') ||
        paket.toLowerCase().includes('amg') ||
        paket.toLowerCase().includes('highline') ||
        paket.toLowerCase().includes('icon')) {
        basePrice *= 1.08; // Top trims
    }

    // 3. DAMAGE ANALYSIS (The Core Request)
    // iterate window.vehicleData to count statuses
    let boyaCount = 0;
    let degisenCount = 0;
    let lokalCount = 0;

    // We need to know which keys are actual parts. 
    // car-render.js uses carSchemas keys.
    // We can assume vehicleData keys that match schema are parts.
    // Or just iterate vehicleData and check values.
    for (let key in window.vehicleData) {
        const val = window.vehicleData[key];
        if (val === 'BoyalÄ±') boyaCount++;
        if (val === 'DeÄŸiÅŸen') degisenCount++;
        if (val === 'Lokal BoyalÄ±') lokalCount++;
    }

    // Deduct
    const boyaDrop = boyaCount * 0.02; // 2% per paint
    const degisenDrop = degisenCount * 0.05; // 5% per change
    const lokalDrop = lokalCount * 0.01; // 1% per local

    const totalDropRate = boyaDrop + degisenDrop + lokalDrop;
    basePrice = basePrice * (1 - totalDropRate);

    // 4. Tramer Drop
    if (tramer > 0) {
        basePrice -= (tramer * 0.8); // Lose almost as much as the record
    }

    // Min floor
    if (basePrice < 50000) basePrice = 50000;

    // Random fluctuation for range
    const min = Math.floor(basePrice * 0.96);
    const max = Math.floor(basePrice * 1.04);

    // Format
    const fmt = (n) => n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });

    const resultArea = document.getElementById('valuationResult');
    if (resultArea) {
        let damageText = "";
        if (boyaCount > 0) damageText += `<span class="badge badge-warning">${boyaCount} Boya</span> `;
        if (degisenCount > 0) damageText += `<span class="badge badge-danger">${degisenCount} DeÄŸiÅŸen</span> `;
        if (tramer > 0) damageText += `<span class="badge badge-secondary">${tramer} TL Tramer</span>`;
        if (damageText === "") damageText = "<span class='badge badge-success'>HatasÄ±z</span>";

        resultArea.innerHTML = `
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:8px; margin-top:10px;">
                <h4 style="margin:0 0 5px 0; color:#166534;"><i class="fas fa-tags"></i> Tahmini Piyasa DeÄŸeri</h4>
                <div style="font-size:1.5rem; font-weight:bold; color:#15803d;">${fmt(min)} - ${fmt(max)}</div>
                <div style="margin-top:5px; font-size:0.9rem;">${damageText}</div>
                <small style="color:#666; display:block; margin-top:5px;">* ${vites}, ${paket} paketi ve hasar durumu baz alÄ±nmÄ±ÅŸtÄ±r.</small>
            </div>
        `;
        resultArea.classList.remove('hidden');
    }
}

async function loadReportForEditing(plaka) {
    try {
        const res = await fetch(`/api/arac/${plaka}`);
        if (!res.ok) throw new Error("AraÃ§ bulunamadÄ±");
        const data = await res.json();

        // Merge flat data if needed (some old data might be nested in kaporta)
        if (data.kaporta) Object.assign(data, data.kaporta);
        window.vehicleData = data; // Set global state for renderer

        // Fill Inputs
        const map = {
            'plaka': 'plaka', 'adSoyad': 'ruhsat_sahibi', 'km': 'km', 'yil': 'yil',
            'marka': 'marka', 'model': 'model', 'renk': 'renk',
            'sasi': 'sasi', 'motor': 'motor',
            'cc': 'motor_cc', 'kw': 'motor_guc', // Assuming these might exist later
            'notes': 'aciklama', 'fiyatAlim': 'fiyat_alim', 'fiyatSat': 'fiyat_sat',
            'paket': 'paket'
        };

        for (let id in map) {
            if (document.getElementById(id) && data[map[id]]) {
                let val = data[map[id]];
                if (id === 'km') {
                    // Format KM on load
                    val = new Intl.NumberFormat('tr-TR').format(val);
                }
                document.getElementById(id).value = val;
            }
        }

        // Dropdowns
        if (data.yakit) {
            const el = document.getElementById('yakit');
            if (el) el.value = data.yakit;
        }
        if (data.vites) {
            const el = document.getElementById('vites');
            if (el) el.value = data.vites;
        }
        if (data.kasa_tipi) {
            const el = document.getElementById('kasa');
            if (el) el.value = data.kasa_tipi;
        }
        if (data.talep_eden) {
            const el = document.getElementById('danismanSelect');
            if (el) el.value = data.talep_eden;
        }

        // Trigger visuals load
        if (typeof loadVisuals === 'function') loadVisuals(data.kasa_tipi || 'Sedan');

        // Allow some time for SVG to build, then apply colors
        setTimeout(() => {
            // car-render.js uses window.vehicleData to colorize in loadVisuals loop
            // But we might need to force refresh if loadVisuals doesn't check vehicleData immediately (it does)
            // Check: loadVisuals iterates schema keys and calls updatePathColor if vehicleData[key] exists.
            // So it should work automatically.
        }, 500);

        // Reset dirty flag initially so modal doesn't trigger erroneously
        if (typeof window.resetDirty === 'function') window.resetDirty();

        showToast("Rapor verileri yÃ¼klendi. DÃ¼zenleyebilirsiniz.");

    } catch (e) {
        console.error(e);
        showToast("DÃ¼zenleme verisi yÃ¼klenemedi: " + e.message, "error");
    }
}

async function saveReport() {
    // if (!document.getElementById('onayCheck').checked) return showToast("LÃ¼tfen onayÄ± iÅŸaretleyiniz.", "error");

    const getVal = (id) => document.getElementById(id).value;
    const getCheck = (id) => document.getElementById(id).checked;

    const data = {
        plaka: getVal('plaka').toUpperCase(),
        marka: getVal('marka'),
        model: getVal('model'),
        yil: getVal('yil') || 0,
        yil: getVal('yil') || 0,
        km: (getVal('km') || '0').replace(/\D/g, ''), // Strip dots/non-digits
        sasi: getVal('sasi'),
        sasi: getVal('sasi'),
        motor: getVal('motor'),
        renk: getVal('renk'),
        ruhsat_sahibi: getVal('adSoyad'),
        cc: getVal('cc'),
        kw: getVal('kw'),
        tramer: getVal('tramer'),
        son_kontrol: getCheck('checkSonKontrol'),
        tescil: getCheck('checkTescil'),
        fatura: getCheck('checkFatura'),
        aciklama: getVal('notes'),
        yakit: getVal('yakitSelect'),
        vites: getVal('vitesSelect'),
        kasa_tipi: getVal('kasaSelect'),
        kaporta: window.vehicleData, // Use global vehicleData from car-render
        // parca_fotograflari: REMOVED
        fiyat_alim: getVal('fiyatAlim'),
        fiyat_sat: getVal('fiyatSat'),
        talep_eden: getVal('danismanSelect') || getVal('talepEden') || "Danisman AdÄ± Yok"
    };

    try {
        const u = JSON.parse(localStorage.getItem('user'));
        if (u) data.rapor_hazirlayan = u.adSoyad;
    } catch (e) { }

    if (!data.plaka) return showToast('PLAKA Zorunludur', 'error');

    try {
        let exists = false;
        try {
            const check = await apiRequest(`arac/${data.plaka}`);
            if (check && check.plaka) exists = true;
        } catch (e) { }

        if (exists) {
            await apiRequest(`arac/${data.plaka}`, 'PUT', data);
            showToast('Rapor GÃ¼ncellendi!');
        } else {
            await apiRequest('arac-ekle', 'POST', data);
            showToast('Rapor OluÅŸturuldu!');
        }
        if (typeof window.resetDirty === 'function') window.resetDirty();
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    } catch (e) {
        showToast("Kaydedilemedi: " + e.message, 'error');
    }
}
= *cascade08=_*cascade08_u *cascade08ux*cascade08xy *cascade08y|*cascade08|~ *cascade08~„*cascade08„… *cascade08…Š*cascade08Š *cascade08*cascade08© *cascade08©œ*cascade08œ¼ *cascade08¼Ë*cascade08ËÒ *cascade08ÒÔ*cascade08Ôû *cascade08ûı*cascade08ış *cascade08ş…*cascade08…† *cascade08†˜*cascade08˜š *cascade08š*cascade08Ÿ *cascade08ŸÁ*cascade08ÁÇ *cascade08Çä*cascade08äå *cascade08åş*cascade08ş€ *cascade08€‹*cascade08‹Œ *cascade08Œ’*cascade08’“ *cascade08“Ñ*cascade08ÑÚ *cascade08ÚÛ*cascade08Ûà *cascade08àá*cascade08áå *cascade08åæ*cascade08æç *cascade08çì*cascade08ìí *cascade08íó*cascade08óô *cascade08ôö*cascade08öø *cascade08ø*cascade08„ *cascade08„…*cascade08…† *cascade08†‰*cascade08‰“ *cascade08“•*cascade08•– *cascade08–¤*cascade08¤¥ *cascade08¥¨*cascade08¨© *cascade08©¬*cascade08¬­ *cascade08­®*cascade08®¯ *cascade08¯´*cascade08´µ *cascade08µ¸*cascade08¸½ *cascade08½¾*cascade08¾Ê *cascade08ÊË*cascade08ËÌ *cascade08ÌĞ*cascade08ĞÑ *cascade08ÑÕ*cascade08ÕÖ *cascade08ÖÜ*cascade08Üİ *cascade08İã*cascade08ãå *cascade08åè*cascade08èì *cascade08ìñ*cascade08ñò *cascade08òø*cascade08øú *cascade08ú€*cascade08€ *cascade08ƒ*cascade08ƒ„ *cascade08„£*cascade08£¤ *cascade08¤ª*cascade08ª« *cascade08«°*cascade08°± *cascade08±³*cascade08³´ *cascade08´Ã*cascade08ÃÄ *cascade08ÄÆ*cascade08ÆÈ *cascade08ÈÌ*cascade08ÌÎ *cascade08ÎÏ*cascade08ÏĞ *cascade08ĞØ*cascade08ØÙ *cascade08Ùö*cascade08ö÷ *cascade08÷Š*cascade08Š *cascade08‘*cascade08‘’ *cascade08’š*cascade08š› *cascade08› *cascade08 ¡ *cascade08¡¥*cascade08¥¦ *cascade08¦¸*cascade08¸º *cascade08º¾*cascade08¾À *cascade08ÀÚ*cascade08ÚÛ *cascade08ÛÜ*cascade08ÜŞ *cascade08Şß*cascade08ßá *cascade08áç*cascade08çè *cascade08èì*cascade08ìî *cascade08îõ*cascade08õ÷ *cascade08÷û*cascade08ûş *cascade08ş	*cascade08	•	 *cascade08•	£	*cascade08£	¤	 *cascade08¤	·	*cascade08·	¹	 *cascade08¹	¾	*cascade08¾	¿	 *cascade08¿	Î	*cascade08Î	Ï	 *cascade08Ï	Ò	*cascade08Ò	Ó	 *cascade08Ó	Ş	*cascade08Ş	ä	 *cascade08ä	ğ	*cascade08ğ	ô	 *cascade08ô	õ	*cascade08õ	ø	 *cascade08ø	ÿ	*cascade08ÿ	†
 *cascade08†
•
*cascade08•
–
 *cascade08–
˜
*cascade08˜
™
 *cascade08™
š
*cascade08š
›
 *cascade08›
œ
*cascade08œ

 *cascade08
§
*cascade08§
®
 *cascade08®
¸
*cascade08¸
¹
 *cascade08¹
»
*cascade08»
½
 *cascade08½
Ç
*cascade08Ç
È
 *cascade08È
Ê
*cascade08Ê
Ì
 *cascade08Ì
Ò
*cascade08Ò
Ó
 *cascade08Ó
Ú
*cascade08Ú
â
 *cascade08â
ã
*cascade08ã
ä
 *cascade08ä
è
*cascade08è
î
 *cascade08î
ò
*cascade08ò
ø
 *cascade08ø
*cascade08 *cascade08¤*cascade08¤¦ *cascade08¦¨*cascade08¨­ *cascade08­±*cascade08±¹ *cascade08¹Â*cascade08ÂÏ *cascade08ÏÓ *cascade08Ó†*cascade08†ˆ *cascade08ˆ‰ *cascade08‰Š*cascade08Š‹ *cascade08‹‘*cascade08‘’ *cascade08’“*cascade08“œ*cascade08œ *cascade08Ÿ*cascade08Ÿ  *cascade08 ×*cascade08×Ù *cascade08Ùâ*cascade08âã *cascade08ãæ*cascade08æç *cascade08ç‚*cascade08‚ƒ *cascade08ƒ¶*cascade08¶¸ *cascade08¸ë*cascade08ëí *cascade08íï *cascade08ï÷*cascade08÷ø *cascade08øù*cascade08ùú *cascade08úû*cascade08ûı *cascade08ı€*cascade08€ *cascade08†*cascade08†ˆ *cascade08ˆ*cascade08 *cascade08‘*cascade08‘ *cascade08¨*cascade08¨© *cascade08©®*cascade08®¯ *cascade08¯µ*cascade08µ· *cascade08·¹*cascade08¹º *cascade08º»*cascade08»Ã *cascade08ÃÄ*cascade08ÄÅ *cascade08ÅÊ*cascade08ÊÌ *cascade08ÌÒ*cascade08ÒÓ *cascade08ÓÔ*cascade08ÔÕ *cascade08Õê*cascade08êë *cascade08ëì*cascade08ìí *cascade08íğ*cascade08ğñ *cascade08ñõ*cascade08õö *cascade08ö÷*cascade08÷ø *cascade08øƒ*cascade08ƒ„ *cascade08„•*cascade08•– *cascade08–*cascade08Ÿ *cascade08Ÿ¤*cascade08¤¥ *cascade08¥½*cascade08½¾ *cascade08¾Å*cascade08ÅÆ *cascade08ÆÓ*cascade08ÓÕ *cascade08ÕÖ*cascade08ÖØ *cascade08Øà*cascade08àá *cascade08áé*cascade08éê *cascade08êì*cascade08ìğ *cascade08ğ÷*cascade08÷ø *cascade08øù*cascade08ùú *cascade08úŠ*cascade08Š’ *cascade08’”*cascade08”• *cascade08•š*cascade08š› *cascade08›ª*cascade08ª« *cascade08«­*cascade08­® *cascade08®±*cascade08±² *cascade08²¶*cascade08¶· *cascade08·¾*cascade08¾À *cascade08ÀÁ*cascade08ÁÃ *cascade08ÃÅ*cascade08ÅÆ *cascade08ÆÇ*cascade08ÇÈ *cascade08ÈÍ*cascade08ÍÎ *cascade08ÎĞ*cascade08ĞÑ *cascade08ÑÖ*cascade08Ö× *cascade08×Ù*cascade08ÙŞ *cascade08Şå*cascade08åæ *cascade08æô*cascade08ôö *cascade08öû*cascade08ûü *cascade08üı*cascade08ış *cascade08şÿ*cascade08ÿ€ *cascade08€„*cascade08„… *cascade08…†*cascade08†‡ *cascade08‡Š*cascade08ŠŒ *cascade08Œ*cascade08 *cascade08“*cascade08“” *cascade08”›*cascade08› *cascade08 *cascade08 § *cascade08§©*cascade08©ª *cascade08ª­*cascade08­® *cascade08®±*cascade08±² *cascade08²·*cascade08·¸ *cascade08¸Á*cascade08ÁÂ *cascade08ÂÈ*cascade08ÈË *cascade08ËÎ*cascade08ÎÏ *cascade08ÏÑ*cascade08ÑÒ *cascade08ÒÔ*cascade08ÔÕ *cascade08ÕŞ*cascade08Şà *cascade08àî*cascade08îï *cascade08ïò*cascade08òó *cascade08óô*cascade08ôú *cascade08úü*cascade08üı *cascade08ıÿ*cascade08ÿ€ *cascade08€*cascade08 *cascade08•*cascade08•– *cascade08–˜*cascade08˜™ *cascade08™¢*cascade08¢£ *cascade08£¥*cascade08¥¦ *cascade08¦±*cascade08±² *cascade08²¸*cascade08¸¹ *cascade08¹»*cascade08»À *cascade08ÀÌ*cascade08ÌÍ *cascade08ÍÕ*cascade08ÕÖ *cascade08ÖŞ*cascade08Şß *cascade08ßé*cascade08éê *cascade08êî*cascade08îï *cascade08ï…*cascade08…‹ *cascade08‹*cascade08 *cascade08‘*cascade08‘’ *cascade08’—*cascade08—˜ *cascade08˜š*cascade08š› *cascade08›Ÿ*cascade08Ÿ  *cascade08 ¡*cascade08¡¢ *cascade08¢¨*cascade08¨© *cascade08©«*cascade08«­ *cascade08­¯*cascade08¯° *cascade08°¹*cascade08¹» *cascade08»½*cascade08½¾ *cascade08¾¿*cascade08¿Á *cascade08ÁÄ*cascade08ÄÅ *cascade08ÅÇ*cascade08ÇÎ *cascade08ÎĞ*cascade08ĞÑ *cascade08ÑÔ*cascade08ÔÕ *cascade08ÕŞ*cascade08Şß *cascade08ßô*cascade08ôø *cascade08øú*cascade08úû *cascade08û€*cascade08€ *cascade08†*cascade08†‡ *cascade08‡‰*cascade08‰Œ *cascade08Œ”*cascade08”• *cascade08•Ÿ*cascade08Ÿ  *cascade08 ©*cascade08©¬ *cascade08¬³*cascade08³µ *cascade08µ¶*cascade08¶· *cascade08·Â*cascade08ÂÃ *cascade08ÃÆ*cascade08ÆÇ *cascade08ÇÈ*cascade08ÈÉ *cascade08ÉÕ*cascade08ÕÖ *cascade08ÖŞ*cascade08Şß *cascade08ßá*cascade08áã *cascade08ãä*cascade08äå *cascade08åì*cascade08ìí *cascade08íó*cascade08óô *cascade08ôö*cascade08öø *cascade08ø€*cascade08€‚ *cascade08‚‡*cascade08‡‰ *cascade08‰‹*cascade08‹ *cascade08*cascade08 *cascade08‘*cascade08‘— *cascade08—™*cascade08™š *cascade08š*cascade08 *cascade08 *cascade08 ¡ *cascade08¡¦*cascade08¦§ *cascade08§«*cascade08«¬ *cascade08¬·*cascade08·¸ *cascade08¸¼*cascade08¼½ *cascade08½¿*cascade08¿À *cascade08Àã*cascade08ãí *cascade08íş*cascade08şŸ *cascade08Ÿ£*cascade08£¦ *cascade08¦¨*cascade08¨© *cascade08©ª*cascade08ª« *cascade08«­*cascade08­® *cascade08®¯*cascade08¯» *cascade08»½*cascade08½É *cascade08ÉÊ*cascade08ÊË *cascade08ËÍ*cascade08ÍÏ *cascade08ÏÒ*cascade08ÒÓ *cascade08Ó×*cascade08×Ù *cascade08ÙÚ*cascade08ÚÛ *cascade08ÛÜ*cascade08Üİ *cascade08İá*cascade08áê *cascade08ê†*cascade08†‡ *cascade08‡Š*cascade08Š *cascade08œ*cascade08œ *cascade08Ÿ*cascade08Ÿº *cascade08º½*cascade08½¾ *cascade08¾¿*cascade08¿À *cascade08ÀÁ*cascade08ÁÃ *cascade08ÃÆ*cascade08ÆÇ *cascade08ÇÉ*cascade08ÉË *cascade08ËÌ*cascade08Ì× *cascade08×Ù*cascade08Ùì *cascade08ìğ*cascade08ğñ *cascade08ñò*cascade08òó *cascade08óô*cascade08ô” *cascade08”–*cascade08– *cascade08Ÿ*cascade08Ÿ¡ *cascade08¡¥*cascade08¥¦ *cascade08¦§*cascade08§ª *cascade08ª¬*cascade08¬® *cascade08®´*cascade08´µ *cascade08µ·*cascade08·Â *cascade08ÂÊ*cascade08ÊÌ *cascade08ÌÏ*cascade08ÏÒ *cascade08ÒÓ*cascade08ÓÔ *cascade08ÔÙ*cascade08ÙÛ *cascade08ÛÜ*cascade08Üİ *cascade08İà*cascade08àá *cascade08áâ*cascade08âã *cascade08ãæ*cascade08æç *cascade08çé*cascade08éê *cascade08êë*cascade08ëì *cascade08ìí*cascade08íî *cascade08îï*cascade08ïñ *cascade08ñó*cascade08óõ *cascade08õø*cascade08øù *cascade08ùû*cascade08ûü *cascade08üı*cascade08ı€ *cascade08€†*cascade08†ˆ *cascade08ˆ‹*cascade08‹ *cascade08“*cascade08“” *cascade08”•*cascade08•– *cascade08–›*cascade08› *cascade08¢*cascade08¢£ *cascade08£¤*cascade08¤« *cascade08«­­³ *cascade08³Ô *cascade08ÔØØ¢ *cascade08¢¦¦’ *cascade08’””˜ *cascade08˜šš‡ *cascade08‡‹‹ *cascade08ª *cascade08ª«*cascade08«¬ *cascade08¬¯*cascade08¯° *cascade08°±*cascade08±½ *cascade08½¾*cascade08¾Ä *cascade08ÄÅ *cascade08ÅÇ*cascade08ÇÎ *cascade08ÎÓ*cascade08ÓÕ *cascade08ÕØ*cascade08ØÙ" *cascade08Ù"Û"*cascade08Û"ã" *cascade08ã"ç"*cascade08ç"è" *cascade08è"ñ"*cascade08ñ"ò" *cascade08ò"ó"*cascade08ó"ô" *cascade08ô"ü"*cascade08ü"ş" *cascade08ş"ÿ"*cascade08ÿ"†# *cascade08†##*cascade08## *cascade08#®#*cascade08®#±# *cascade08±#´#*cascade08´#µ# *cascade08µ#Î#*cascade08Î#Ï# *cascade08Ï#Ó#*cascade08Ó#Ô# *cascade08Ô#í#*cascade08í#î# *cascade08î#–$*cascade08–$˜$ *cascade08˜$®$*cascade08®$¯$ *cascade08¯$Ä$*cascade08Ä$Å$ *cascade08Å$Û$*cascade08Û$İ$ *cascade08İ$æ$*cascade08æ$è$ *cascade08è$ë$*cascade08ë$ï$ *cascade08ï$‘%*cascade08‘%’% *cascade08’%–%*cascade08–%—% *cascade08—%˜%*cascade08˜%™% *cascade08™%¦%*cascade08¦%§% *cascade08§%Ç%*cascade08Ç%È% *cascade08È%É%*cascade08É%Ì% *cascade08Ì%ú%*cascade08ú%û% *cascade08û%š&*cascade08š&›& *cascade08›&œ&*cascade08œ&& *cascade08& &*cascade08 &£& *cascade08£&â&*cascade08â&ã& *cascade08ã&ê&*cascade08ê&ì& *cascade08ì& '*cascade08 '¡' *cascade08¡'£'*cascade08£'¤' *cascade08¤'¨'*cascade08¨'©' *cascade08©'«'*cascade08«'¬' *cascade08¬'Î'*cascade08Î'Ï' *cascade08Ï'ã'*cascade08ã'ä' *cascade08ä'å'*cascade08å'ç' *cascade08ç'é'*cascade08é'ì' *cascade08ì'ø'*cascade08ø'ù' *cascade08ù'ú'*cascade08ú'û' *cascade08û'ü'*cascade08ü'ı' *cascade08ı'ƒ(*cascade08ƒ(„( *cascade08„(©(*cascade08©(ª( *cascade08ª(½(*cascade08½(¾( *cascade08¾(Õ(*cascade08Õ(Ö( *cascade08Ö(İ(*cascade08İ(Ş( *cascade08Ş(à(*cascade08à(ñ( *cascade08ñ(û(*cascade08û(¶) *cascade08¶)À)*cascade08À)Ç) *cascade08Ç)È)*cascade08È)Ê) *cascade08Ê)Î)*cascade08Î)Ö) *cascade08Ö)à)*cascade08à)œ* *cascade08œ* **cascade08 *¶* *cascade08¶*º**cascade08º*¿* *cascade08¿*¿**cascade08¿*Á* *cascade08Á*Å**cascade08Å*Œ+ *cascade08Œ++*cascade08+œ+ *cascade08œ+ +*cascade08 +«+ *cascade08«+¯+*cascade08¯+Ë+ *cascade08Ë+Ï+*cascade08Ï+Ú+ *cascade08Ú+Û+*cascade08Û+ç+ *cascade08ç+ô+*cascade08ô+•, *cascade08•,™,*cascade08™, , *cascade08 ,¤,*cascade08¤,ó, *cascade08ó,÷,*cascade08÷,ˆ- *cascade08ˆ-’-*cascade08’-¶- *cascade08¶-Á-*cascade08Á-Ò- *cascade08Ò-Û-*cascade08Û-ô- *cascade08ô-ù-*cascade08ù-„. *cascade08„.‰.*cascade08‰.’. *cascade08’.—.*cascade08—.¢. *cascade08¢.®.*cascade08®.¯. *cascade08¯.°.*cascade08°.¾. *cascade08¾.¿.*cascade08¿.À. *cascade08À.Á.*cascade08Á.Õ. *cascade08Õ.Ö.*cascade08Ö.İ. *cascade08İ.ß.*cascade08ß.à. *cascade08à.á.*cascade08á.â. *cascade08â.ã.*cascade08ã.ä. *cascade08ä.è.*cascade08è.ê. *cascade08ê.ë.*cascade08ë.í. *cascade08í.ï.*cascade08ï.ğ. *cascade08ğ.ñ.*cascade08ñ.û. *cascade08û.ü.*cascade08ü.ÿ. *cascade08ÿ./*cascade08/‚/ *cascade08‚/ƒ/*cascade08ƒ/„/ *cascade08„/…/*cascade08…/†/ *cascade08†/ˆ/*cascade08ˆ/Š/ *cascade08Š/Œ/*cascade08Œ// *cascade08/‘/*cascade08‘/œ/ *cascade08œ//*cascade08/Ÿ/ *cascade08Ÿ/¡/*cascade08¡/¢/ *cascade08¢/£/*cascade08£/¦/ *cascade08¦/§/*cascade08§/¨/ *cascade08¨/©/*cascade08©/¯/ *cascade08¯/°/*cascade08°/²/ *cascade08²/³/*cascade08³/¹/ *cascade08¹/»/*cascade08»/¼/ *cascade08¼/¿/*cascade08¿/À/ *cascade08À/Â/*cascade08Â/Ã/ *cascade08Ã/Ä/*cascade08Ä/Å/ *cascade08Å/Æ/*cascade08Æ/È/ *cascade08È/Ì/*cascade08Ì/Í/ *cascade08Í/Ñ/*cascade08Ñ/İ/ *cascade08İ/Ş/*cascade08Ş/ß/ *cascade08ß/à/*cascade08à/ñ/ *cascade08ñ/ò/*cascade08ò/ø/ *cascade08ø/ù/*cascade08ù/ş/ *cascade08ş/‡0*cascade08‡0Š0 *cascade08Š0‹0*cascade08‹0Œ0 *cascade08Œ00*cascade0800 *cascade080’0*cascade08’0•0 *cascade08•0™0*cascade08™0œ0 *cascade08œ00*cascade0800 *cascade080Ÿ0*cascade08Ÿ0£0 *cascade08£0¤0*cascade08¤0¥0 *cascade08¥0¨0*cascade08¨0¸0 *cascade08¸0¹0*cascade08¹0º0 *cascade08º0¼0*cascade08¼0¿0 *cascade08¿0Ğ0*cascade08Ğ0İ0 *cascade08İ0Ş0*cascade08Ş0ß0 *cascade08ß0â0*cascade08â0ã0 *cascade08ã0æ0*cascade08æ0ç0 *cascade08ç0è0*cascade08è0é0 *cascade08é0ë0*cascade08ë0ì0 *cascade08ì0î0*cascade08î0ï0 *cascade08ï0ğ0*cascade08ğ0ş0 *cascade08ş01*cascade081„1 *cascade08„1…1*cascade08…1ˆ1 *cascade08ˆ1Š1*cascade08Š1‹1 *cascade08‹11*cascade081 1 *cascade08 1£1*cascade08£1¦1 *cascade08¦1¨1*cascade08¨1©1 *cascade08©1ª1*cascade08ª1­1 *cascade08­1®1*cascade08®1¯1 *cascade08¯1°1*cascade08°1²1 *cascade08²1³1*cascade08³1´1 *cascade08´1µ1*cascade08µ1·1 *cascade08·1¸1*cascade08¸1¹1 *cascade08¹1»1*cascade08»1¼1 *cascade08¼1½1*cascade08½1Á1 *cascade08Á1Ã1*cascade08Ã1Ç1 *cascade08Ç1È1*cascade08È1â1 *cascade08â1ä1*cascade08ä1æ1 *cascade08æ1è1*cascade08è1í1 *cascade08í1ï1*cascade08ï1ñ1 *cascade08ñ1ò1*cascade08ò1÷1 *cascade08÷1ù1*cascade08ù1ú1 *cascade08ú1ü1*cascade08ü1ş1 *cascade08ş1ÿ1*cascade08ÿ1‚2 *cascade08‚2„2*cascade08„2…2 *cascade08…2‰2*cascade08‰2š2 *cascade08š2›2*cascade08›22 *cascade082 2*cascade08 2¡2 *cascade08¡2¦2*cascade08¦2«2 *cascade08«2®2*cascade08®2¯2 *cascade08¯2°2*cascade08°2¾2 *cascade08¾2À2*cascade08À2Á2 *cascade08Á2Â2*cascade08Â2Ã2 *cascade08Ã2Ä2*cascade08Ä2Æ2 *cascade08Æ2È2*cascade08È2É2 *cascade08É2Ê2*cascade08Ê2Î2 *cascade08Î2Õ2*cascade08Õ2İ2 *cascade08İ2æ2*cascade08æ2è2 *cascade08è2ê2*cascade08ê2ñ2 *cascade08ñ2ò2*cascade08ò2ó2 *cascade08ó2ô2*cascade08ô2õ2 *cascade08õ2ö2*cascade08ö2ø2 *cascade08ø2ù2*cascade08ù2ü2 *cascade08ü2ı2*cascade08ı23 *cascade083’3*cascade08’3”3 *cascade08”3—3*cascade08—3š3 *cascade08š3œ3*cascade08œ33 *cascade083Ÿ3*cascade08Ÿ3«3 *cascade08«3¬3*cascade08¬3¯3 *cascade08¯3³3*cascade08³3´3 *cascade08´3¸3*cascade08¸3¹3 *cascade08¹3º3*cascade08º3»3 *cascade08»3½3*cascade08½3¾3 *cascade08¾3¿3*cascade08¿3À3 *cascade08À3Â3*cascade08Â3Ã3 *cascade08Ã3Ä3*cascade08Ä3È3 *cascade08È3Ê3*cascade08Ê3Ó3 *cascade08Ó3Ö3*cascade08Ö3×3 *cascade08×3Ø3*cascade08Ø3Ù3 *cascade08Ù3å3*cascade08å3æ3 *cascade08æ3ê3*cascade08ê3ì3 *cascade08ì3í3*cascade08í3ü3 *cascade08ü3ı3*cascade08ı3ş3 *cascade08ş3‰4*cascade08‰4Œ4 *cascade08Œ44*cascade0844 *cascade084‘4*cascade08‘4 4 *cascade08 4¥4*cascade08¥4©4 *cascade08©4­4*cascade08­4®4 *cascade08®4¯4*cascade08¯4°4 *cascade08°4±4*cascade08±4µ4 *cascade08µ4º4*cascade08º4»4 *cascade08»4½4*cascade08½4¾4 *cascade08¾4À4*cascade08À4Ô4 *cascade08Ô4Õ4*cascade08Õ4×4 *cascade08×4Ù4*cascade08Ù4Û4 *cascade08Û4ò4*cascade08ò4ô4 *cascade08ô4õ4*cascade08õ4÷4 *cascade08÷4ÿ4*cascade08ÿ4Œ5 *cascade08Œ55*cascade0855 *cascade085‘5*cascade08‘5¦5 *cascade08¦5©5*cascade08©5ª5 *cascade08ª5«5*cascade08«5­5 *cascade08­5±5*cascade08±5²5 *cascade08²5Ã5*cascade08Ã5Ä5 *cascade08Ä5Ì5*cascade08Ì5Î5 *cascade08Î5Ñ5*cascade08Ñ5Ş5 *cascade08Ş5á5*cascade08á5â5 *cascade08â5ã5*cascade08ã5ø5 *cascade08ø5ş5*cascade08ş5ÿ5 *cascade08ÿ5€6*cascade08€6ƒ6 *cascade08ƒ6„6*cascade08„6“6 *cascade08“66*cascade086Ÿ6 *cascade08Ÿ6­6*cascade08­6¯6 *cascade08¯6±6*cascade08±6³6 *cascade08³6¹6*cascade08¹6Æ6 *cascade08Æ6È6*cascade08È6Ê6 *cascade08Ê6Î6*cascade08Î6Ò6 *cascade08Ò6Ö6*cascade08Ö6ç6 *cascade08ç6ê6*cascade08ê6ë6 *cascade08ë6ì6*cascade08ì6í6 *cascade08í6ı6*cascade08ı6ş6 *cascade08ş6‚7*cascade08‚7ƒ7 *cascade08ƒ7„7*cascade08„7…7 *cascade08…7†7*cascade08†7ˆ7 *cascade08ˆ7‹7*cascade08‹7Œ7 *cascade08Œ77*cascade087‘7 *cascade08‘7•7*cascade08•7—7 *cascade08—7œ7*cascade08œ77 *cascade087¡7*cascade08¡7°7 *cascade08°7±7*cascade08±7Ì7 *cascade08Ì7Ô7*cascade08Ô7¢8 *cascade08¢8¤8*cascade08¤8¥8 *cascade08¥8¦8*cascade08¦8§8 *cascade08§8¨8*cascade08¨8²8 *cascade08²8¶8*cascade08¶8½8 *cascade08½8¾8*cascade08¾8Ã8 *cascade08Ã8Ä8*cascade08Ä8”9 *cascade08”9š9*cascade08š9›9 *cascade08›99*cascade089Ÿ9 *cascade08Ÿ9 9*cascade08 9©9 *cascade08©9ª9*cascade08ª9¯9 *cascade08¯9°9*cascade08°9é9 *cascade08é9ë9*cascade08ë9ì9 *cascade08ì9ï9*cascade08ï9£: *cascade08£:¬:*cascade08¬:Ä: *cascade08Ä:Û:*cascade08Û:; *cascade08;–;*cascade08–;š; *cascade08š;;*cascade08;; *cascade08; ;*cascade08 ;¡; *cascade08¡;¢;*cascade08¢;£; *cascade08£;¦;*cascade08¦;À; *cascade08À;Í;*cascade08Í;Î; *cascade08Î;Ñ;*cascade08Ñ;Ò; *cascade08Ò;Ö;*cascade08Ö;×; *cascade08×;è;*cascade08è;é; *cascade08é;ï;*cascade08ï;ğ; *cascade08ğ;ƒ<*cascade08ƒ<†< *cascade08†<¨<*cascade08¨<®< *cascade08®<³<*cascade08³<´< *cascade08´<¹<*cascade08¹<º< *cascade08º<»<*cascade08»<¼< *cascade08¼<¾<*cascade08¾<¿< *cascade08¿<Å<*cascade08Å<Ç< *cascade08Ç<Õ<*cascade08Õ<Ö< *cascade08Ö<Ø<*cascade08Ø<Ş< *cascade08Ş<ã<*cascade08ã<ä< *cascade08ä<ç<*cascade08ç<è< *cascade08è<é<*cascade08é<ê< *cascade08ê<ï<*cascade08ï<ğ< *cascade08ğ<”=*cascade08”=•= *cascade08•=œ=*cascade08œ== *cascade08=¸=*cascade08¸=º= *cascade08º=Å=*cascade08Å=×= *cascade08×=Ú=*cascade08Ú=•@ *cascade08•@ÆB*cascade08ÆB¢C *cascade08¢C¥C*cascade08¥C°C *cascade08°C±C*cascade08±CËC *cascade08ËCÌC*cascade08ÌCÒC *cascade08ÒCãC*cascade08ãCóC *cascade08óCôC*cascade08ôC…D *cascade08…D‰D*cascade08‰DŠD *cascade08ŠDD*cascade08D«D *cascade08«DÉD*cascade08ÉDêD *cascade08êDëD*cascade08ëDñD *cascade08ñD„E*cascade08„E’E *cascade08’E“E*cascade08“E³E *cascade08³E¾F*cascade08¾F¿F *cascade08¿FÜF*cascade08ÜFİF *cascade08İFïF*cascade08ïFûF *cascade08ûFüF*cascade08üFıF *cascade08ıFÿF*cascade08ÿFƒG *cascade08ƒG„G*cascade08„G‹G *cascade08‹G©G*cascade08©GªG *cascade08ªG¸G*cascade08¸G¹G *cascade08¹GÙG*cascade08ÙGÚG *cascade08ÚGúG*cascade08úGûG *cascade08ûG“H*cascade08“H”H *cascade08”H—H*cascade08—H˜H *cascade08˜H½H*cascade08½H¾H *cascade08¾HÕH*cascade08ÕHÖH *cascade08ÖHÚH*cascade08ÚHÛH *cascade08ÛHİH*cascade08İHŞH *cascade08ŞH‚I*cascade08‚IƒI *cascade08ƒI„I*cascade08„I…I *cascade08…IˆI*cascade08ˆI‰I *cascade08‰IŠI*cascade08ŠI‹I *cascade08‹II*cascade08II *cascade08IÛI*cascade08ÛIæI *cascade08æIÆJ*cascade08ÆJÏJ *cascade08ÏJÒJ*cascade08ÒJÓJ *cascade08ÓJŞJ*cascade08ŞJßJ *cascade08ßJëJ*cascade08ëJíJ *cascade08íJòJ*cascade08òJõJ *cascade08õJöJ*cascade08öJ÷J *cascade08÷J¾K*cascade08¾K¿K *cascade08¿KÄK*cascade08ÄKÅK *cascade08ÅKæK*cascade08æKçK *cascade08çKîK*cascade08îKïK *cascade08ïKûK*cascade08ûKüK *cascade08üK‡L*cascade08‡LˆL *cascade08ˆLªL*cascade08ªL«L *cascade08«L¼L*cascade08¼L½L *cascade08½LÁL*cascade08ÁLÂL *cascade08ÂLâL*cascade08âLõL *cascade08õLıL*cascade08ıLşL *cascade08şL¤M*cascade08¤M¥M *cascade08¥MÓM*cascade08ÓMÔM *cascade08ÔMßM*cascade08ßMàM *cascade08àMåM*cascade08åMæM *cascade08æM‰N*cascade08‰NŠN *cascade08ŠN¢N*cascade08¢N£N *cascade08£NØN*cascade08ØNŞN *cascade08ŞNëN*cascade08ëNìN *cascade08ìNøN*cascade08øNùN *cascade08ùNO*cascade08OO *cascade08O—O*cascade08—OO *cascade08O€P*cascade08€PP *cascade08P‹P*cascade08‹PŒP *cascade08ŒP–P*cascade08–P—P *cascade08—PŸP*cascade08ŸP P *cascade08 P£P*cascade08£P¤P *cascade08¤P»P*cascade08»P¼P *cascade08¼P†Q*cascade08†Q‡Q *cascade08‡QR*cascade08R¬R *cascade08¬R¶R*cascade08¶RâR *cascade08âRãR*cascade08ãR‘S *cascade08‘S’S*cascade08’SU *cascade08UÈX*cascade08ÈXÕ[ *cascade08Õ[©\*cascade08©\Á\ *cascade08Á\à\*cascade08à\ä\ *cascade08ä\ñ\*cascade08ñ\ò\ *cascade08ò\÷\*cascade08÷\ù\ *cascade08ù\†]*cascade08†]‡] *cascade08‡]]*cascade08]‘] *cascade08‘]Ô]*cascade08Ô]Õ] *cascade08Õ]à]*cascade08à]á] *cascade08á]û]*cascade08û]ü] *cascade08ü]™^*cascade08™^š^ *cascade08š^›^*cascade08›^œ^ *cascade08œ^Ë^*cascade08Ë^Í^ *cascade08Í^Ï^*cascade08Ï^Ğ^ *cascade08Ğ^ğ^*cascade08ğ^ñ^ *cascade08ñ^¦_*cascade08¦_§_ *cascade08§_Ì_*cascade08Ì_Í_ *cascade08Í_Î_*cascade08Î_Ï_ *cascade08Ï_Õ_*cascade08Õ_Ö_ *cascade08Ö_ë_*cascade08ë_ì_ *cascade08ì_ò_*cascade08ò_ó_ *cascade08ó_õ_*cascade08õ_ö_ *cascade08ö_Š`*cascade08Š`‹` *cascade08‹``*cascade08`` *cascade08`’`*cascade08’`“` *cascade08“`¦`*cascade08¦`§` *cascade08§`¯`*cascade08¯`°` *cascade08°`Â`*cascade08Â`Ã` *cascade08Ã`Æ`*cascade08Æ`Ç` *cascade08Ç`Ş`*cascade08Ş`ß` *cascade08ß`æ`*cascade08æ`ç` *cascade08ç`£a*cascade08£a¥a *cascade08¥aÀa*cascade08ÀaÁa *cascade08Áa†b*cascade08†bˆb *cascade08ˆb’b*cascade08’b“b *cascade08“bÙb*cascade08ÙbÚb *cascade08ÚbÑc*cascade08ÑcÒc *cascade08ÒcÙc*cascade08ÙcÚc *cascade08ÚcŞc*cascade08Şcßc *cascade08ßcàc*cascade08àcác *cascade08ácøc*cascade08øcùc *cascade08ùc˜d*cascade08˜d™d *cascade08™d¦d*cascade08¦d§d *cascade08§d²d *cascade08²dµd*cascade08µd¶d *cascade08¶d·d*cascade08·dÊd *cascade08ÊdÎd*cascade08Îdğe *cascade08ğeÂg*cascade08Âgæg *cascade08ægçg*cascade08çgèg *cascade08ègég*cascade08égùg *cascade08ùgh *cascade08hˆh*cascade08ˆhh *cascade08h‘h*cascade08‘h’h *cascade08’h—h*cascade08—h˜h *cascade08˜h¦h*cascade08¦h§h *cascade08§h¶h *cascade08¶hĞhĞhîh *cascade08îhƒiƒi…i *cascade08…i‡i*cascade08‡iˆi *cascade08ˆi‰i*cascade08‰iŠi *cascade08Ši‹i *cascade08‹i§i *cascade08§i²i*cascade08²iÂi *cascade08ÂiÜiÜiúi *cascade08úijj‘j *cascade08‘j“j*cascade08“j”j *cascade08”j•j*cascade08•j©j *cascade08©j³j *cascade08³j¾j*cascade08¾jÒj *cascade08Òjìjìj‰k *cascade08‰kkk k *cascade08 k¢k*cascade08¢k£k *cascade08£k¤k*cascade08¤k»k *cascade08»k¼k *cascade08¼kÇk*cascade08ÇkÉk *cascade08Ékèl*cascade08èlêl*cascade08êlòl *cascade08òlöl*cascade08öl÷l *cascade08÷lúl*cascade08úlûl *cascade08ûlÿl*cascade08ÿlm *cascade08m‚m*cascade08‚mƒm *cascade08ƒm—m*cascade08—m˜m *cascade08˜mğm*cascade08ğmñm *cascade08ñm‚n*cascade08‚nƒn *cascade08ƒn”n*cascade08”n•n *cascade08•n—n*cascade08—n˜n *cascade08˜nÚn*cascade08ÚnÛn *cascade08Ûnîn*cascade08înğn *cascade08ğnòn*cascade08ònón *cascade08ón‹o*cascade08‹oŒo *cascade08Œoo*cascade08oo *cascade08o¤p*cascade08¤p¦p *cascade08¦p¬p*cascade08¬p­p *cascade08­p®p*cascade08®p¯p *cascade08¯p·p*cascade08·p¹p *cascade08¹pÕp*cascade08ÕpÖp *cascade08Öpİp*cascade08İpáp *cascade08áp‘q*cascade08‘q’q *cascade08’qÀq *cascade08ÀqŒr *cascade08ŒrrrÕr *cascade08Õr×r×rÛr *cascade08Ûrİrİrşr *cascade08şrÿr *cascade08ÿr‰s*cascade08‰sŠs *cascade08Šs“s*cascade08“s”s *cascade08”ss *cascade08s¢s¢sµs *cascade08µs¹s¹sÌs *cascade08ÌsĞsĞs•t *cascade08•t™t *cascade08™ttt¥t *cascade08¥t¦t *cascade08¦t°t*cascade08°t±t *cascade08±tÈt*cascade08ÈtËt*cascade08ËtÌt *cascade08ÌtÍt*cascade08ÍtÎt *cascade08Îtçt*cascade08çtét *cascade08étşt*cascade08ştÿt *cascade08ÿtu*cascade08u‚u *cascade08‚u…u*cascade08…u†u *cascade08†u‹u*cascade08‹uŒu *cascade08Œuu*cascade08uu *cascade08ušu*cascade08šu›u *cascade08›uŸu*cascade08Ÿu u *cascade08 u¢u*cascade08¢u£u *cascade08£u¦u*cascade08¦u¨u *cascade08¨u¯u*cascade08¯u°u *cascade08°u¼u*cascade08¼uÂu *cascade08ÂuÇu*cascade08ÇuÈu *cascade08ÈuÎu*cascade08ÎuÏu *cascade08ÏuĞu*cascade08ĞuÑu *cascade08ÑuÕu*cascade08ÕuÖu *cascade08ÖuØu*cascade08ØuÙu *cascade08Ùuİu*cascade08İuŞu *cascade08Şuóu*cascade08óuúu *cascade08úuûu*cascade08ûuv *cascade08v†v*cascade08†v‡v *cascade08‡vv*cascade08vv *cascade08v‘v*cascade08‘v’v *cascade08’v™v*cascade08™všv *cascade08šv®v*cascade08®v¯v *cascade08¯v²v*cascade08²v³v *cascade08³vßv*cascade08ßvàv *cascade08àvãv*cascade08ãvåv *cascade08åvëv*cascade08ëvív *cascade08ívîv*cascade08îvïv *cascade08ïvòv*cascade08òvõv *cascade08õvıv*cascade08ıvşv *cascade08şvÿv*cascade08ÿv€w *cascade08€w‚w*cascade08‚w”w *cascade08”wšw*cascade08šw¤w *cascade08¤w¦w*cascade08¦w®w *cascade08®w¯w*cascade08¯w°w *cascade08°w±w*cascade08±w³w *cascade08³w¶w*cascade08¶w¸w *cascade08¸wÅw*cascade08ÅwÏw *cascade08ÏwÑw*cascade08ÑwÔw *cascade08ÔwÚw*cascade08ÚwÜw *cascade08ÜwŞw*cascade08Şwáw *cascade08áwæw*cascade08æwñw *cascade08ñw“x*cascade08“x”x *cascade08”x•x*cascade08•x—x *cascade08—x˜x*cascade08˜xx*cascade08x¡x *cascade08¡x¢x*cascade08¢x¤x *cascade08¤x¨x *cascade08¨x©x*cascade08©xªx *cascade08ªx÷x÷xˆy *cascade08ˆyy*cascade08y¨y *cascade08¨y®y*cascade08®y·y *cascade08·yÌy*cascade08ÌyÎy *cascade08ÎyÑy*cascade08ÑyÒy *cascade08ÒyÖy*cascade08Öyáy *cascade08áyæy*cascade08æyèy *cascade08èyêy*cascade08êyëy *cascade08ëyôy*cascade08ôyõy *cascade08õyz*cascade08zz *cascade08z–z*cascade08–zœz *cascade08œzÎz*cascade08ÎzĞz *cascade08ĞzÖz*cascade08Öz×z *cascade08×zÚz*cascade08Úzåz *cascade08åzêz*cascade08êzëz *cascade08ëzìz*cascade08ìzíz *cascade08ízîz*cascade08îzïz *cascade08ïzˆ{*cascade08ˆ{‰{ *cascade08‰{ {*cascade08 {¡{ *cascade08¡{ª{*cascade08ª{«{ *cascade08«{Å{*cascade08Å{Æ{ *cascade08Æ{È{*cascade08È{Ê{ *cascade08Ê{Ò{*cascade08Ò{Ô{ *cascade08Ô{Ø{*cascade08Ø{Ù{ *cascade08Ù{ß{*cascade08ß{á{ *cascade08á{ì{*cascade08ì{í{ *cascade08í{ğ{*cascade08ğ{ñ{ *cascade08ñ{|*cascade08|‚| *cascade08‚|…|*cascade08…|—| *cascade08—||*cascade08|£| *cascade08£|©|*cascade08©|¾| *cascade08¾|Ä|*cascade08Ä|Ë| *cascade08Ë|Í|*cascade08Í|Ï| *cascade08Ï|Ó|*cascade08Ó|é| *cascade08é|ï|*cascade08ï|õ| *cascade08õ|÷|*cascade08÷|ù| *cascade08ù|ı|*cascade08ı|€} *cascade08€}}*cascade08}ˆ} *cascade08ˆ}¤}*cascade08¤}¨} *cascade08¨}¶}*cascade08¶}·} *cascade08·}»}*cascade08»}¼} *cascade08¼}Ä}*cascade08Ä}Æ} *cascade08Æ}Î}*cascade08Î}Ø} *cascade08Ø}Û}*cascade08Û}ï} *cascade08ï}ö}*cascade08ö}€~ *cascade08€~ƒ~*cascade08ƒ~„~ *cascade08„~…~*cascade08…~Š~ *cascade08Š~Œ~ *cascade08Œ~’~*cascade08’~ª~ *cascade08ª~¯~ *cascade08¯~³~*cascade08³~µ~ *cascade08µ~»~*cascade08»~Ş~ *cascade08Ş~ä~*cascade08ä~æ~ *cascade08æ~‚*cascade08‚ *cascade08 *cascade08*cascade08› *cascade08›œ*cascade08œ *cascade08Ÿ*cascade08Ÿ  *cascade08 ¡*cascade08¡ª *cascade08ª¬*cascade08¬° *cascade08°´ *cascade08´Á *cascade08ÁÃ*cascade08ÃÓ *cascade08ÓÔ *cascade08ÔÚ*cascade08ÚÛ *cascade08ÛÜ*cascade08Üİ *cascade08İá*cascade08áâ *cascade08âë*cascade08ëî *cascade08îğ*cascade08ğñ *cascade08ñò*cascade08òô *cascade08ôö*cascade08öø *cascade08øû *cascade08û€€ *cascade08€€‚€ *cascade08‚€ƒ€*cascade08ƒ€†€ *cascade08†€‡€ *cascade08‡€Š€*cascade08Š€‹€ *cascade08‹€Œ€*cascade08Œ€€ *cascade08€©€*cascade08©€­€ *cascade08­€¯€ *cascade08¯€°€*cascade08°€±€ *cascade08±€¶€*cascade08¶€·€*cascade08·€Â€*cascade08Â€Ä€ *cascade08Ä€È€ *cascade08È€É€*cascade08É€Ó€ *cascade08Ó€Õ€ *cascade08Õ€×€*cascade08×€Ø€ *cascade08Ø€Ù€*cascade08Ù€Ú€ *cascade08Ú€İ€*cascade08İ€Ş€ *cascade08Ş€ß€*cascade08ß€à€ *cascade08à€ä€*cascade08ä€å€ *cascade08å€æ€*cascade08æ€ç€ *cascade08ç€ú€*cascade08ú€û€ *cascade08û€…*cascade08…Œ *cascade08Œ *cascade08— *cascade08—œ *cascade08œ¤*cascade08¤¥ *cascade08¥ª*cascade08ª« *cascade08«¬*cascade08¬­ *cascade08­¯*cascade08¯¸ *cascade08¸¹*cascade08¹º*cascade08º» *cascade08»À *cascade08ÀÄ*cascade08ÄÈ *cascade08ÈÉ *cascade08ÉÌ *cascade08ÌÍ *cascade08ÍÎ*cascade08ÎÏ *cascade08ÏĞ*cascade08ĞÑ *cascade08ÑÔ*cascade08ÔÕ *cascade08ÕŞ*cascade08Şß *cascade08ßä*cascade08äå *cascade08åç*cascade08çè *cascade08èé*cascade08éë *cascade08ëî*cascade08îğ *cascade08ğû*cascade08ûü *cascade08üÿ*cascade08ÿ€‚ *cascade08€‚‚ *cascade08‚‚ *cascade08‚‘‚ *cascade08‘‚’‚*cascade08’‚“‚ *cascade08“‚™‚ *cascade08™‚›‚*cascade08›‚œ‚ *cascade08œ‚£‚*cascade08£‚¥‚ *cascade08¥‚¨‚*cascade08¨‚ª‚ *cascade08ª‚«‚*cascade08«‚¬‚ *cascade08¬‚³‚*cascade08³‚´‚ *cascade08´‚·‚*cascade08·‚½‚ *cascade08½‚Á‚*cascade08Á‚Â‚ *cascade08Â‚È‚ *cascade08È‚É‚*cascade08É‚Ğ‚ *cascade08Ğ‚Ø‚ *cascade08Ø‚Ş‚ *cascade08Ş‚ß‚*cascade08ß‚ä‚ *cascade08ä‚å‚ *cascade08å‚ç‚*cascade08ç‚ô‚ *cascade08ô‚õ‚*cascade08õ‚ˆƒ *cascade08ˆƒ‰ƒ*cascade08‰ƒƒ *cascade08ƒ˜ƒ*cascade08˜ƒ™ƒ *cascade08™ƒœƒ*cascade08œƒ ƒ *cascade08 ƒ¡ƒ*cascade08¡ƒ¥ƒ *cascade08¥ƒ¦ƒ*cascade08¦ƒ§ƒ *cascade08§ƒ¨ƒ*cascade08¨ƒ­ƒ *cascade08­ƒ®ƒ*cascade08®ƒ¶ƒ *cascade08¶ƒ¸ƒ*cascade08¸ƒºƒ *cascade08ºƒÀƒ*cascade08ÀƒÁƒ *cascade08ÁƒÎƒ*cascade08ÎƒĞƒ *cascade08ĞƒÚƒ *cascade08Úƒìƒ*cascade08ìƒğƒ *cascade08ğƒòƒ *cascade08òƒöƒ *cascade08öƒùƒ *cascade08ùƒûƒ *cascade08ûƒ†„*cascade08†„‡„ *cascade08‡„ˆ„*cascade08ˆ„Š„ *cascade08Š„„*cascade08„„ *cascade08„‘„*cascade08‘„“„ *cascade08“„”„*cascade08”„•„ *cascade08•„—„*cascade08—„˜„ *cascade08˜„Ÿ„*cascade08Ÿ„ „ *cascade08 „¦„*cascade08¦„¾„ *cascade08¾„¿„*cascade08¿„Å„ *cascade08Å„È„*cascade08È„Ê„ *cascade08Ê„Ì„*cascade08Ì„Í„ *cascade08Í„Î„*cascade08Î„Ñ„ *cascade08Ñ„Ó„*cascade08Ó„Û„ *cascade08Û„à„ *cascade08à„ì„ *cascade08ì„í„*cascade08í„«… *cascade08«…­… *cascade08­…÷… *cascade08÷…û…*cascade08û…Š† *cascade08Š††*cascade08†’† *cascade08’†˜†*cascade08˜†›† *cascade08›††*cascade08†Ÿ† *cascade08Ÿ† †*cascade08 †¡† *cascade08¡†¤†*cascade08¤†¥† *cascade08¥†³†*cascade08³†µ† *cascade08µ†º†*cascade08º†»† *cascade08»†¿†*cascade08¿†À† *cascade08À†Ä†*cascade08Ä†Æ† *cascade08Æ†Ê†*cascade08Ê†Ğ† *cascade082Ifile:///c:/Users/Emmi/Documents/ekspertiz-node/public/js/report-wizard.js