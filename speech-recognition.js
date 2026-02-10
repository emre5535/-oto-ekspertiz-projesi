Ò</**
 * SESLƒ∞ KOMUT Sƒ∞STEMƒ∞ (Voice Command)
 * Web Speech API kullanƒ±larak sesli komutlarƒ± i≈üler.
 */

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const partMapping = {
    // GRUPLAR (E≈û ZAMANLI ƒ∞≈ûLEM ƒ∞√áƒ∞N)
    "sol yan": ["sol_on_camurluk", "sol_on_kapi", "sol_arka_kapi", "sol_arka_camurluk"],
    "saƒü yan": ["sag_on_camurluk", "sag_on_kapi", "sag_arka_kapi", "sag_arka_camurluk"],
    "yanlar": ["sol_on_camurluk", "sol_on_kapi", "sol_arka_kapi", "sol_arka_camurluk", "sag_on_camurluk", "sag_on_kapi", "sag_arka_kapi", "sag_arka_camurluk"],
    "tavan kaput bagaj": ["tavan", "kaput", "bagaj"],
    "√∂n kafa": ["sol_on_camurluk", "sag_on_camurluk", "kaput"],
    "arka kafa": ["sol_arka_camurluk", "sag_arka_camurluk", "bagaj"],

    // SOL
    "sol √∂n √ßamurluk": "sol_on_camurluk",
    "sol √∂n kapƒ±": "sol_on_kapi",
    "sol arka kapƒ±": "sol_arka_kapi",
    "sol arka √ßamurluk": "sol_arka_camurluk",

    // SAG
    "saƒü √∂n √ßamurluk": "sag_on_camurluk",
    "saƒü √∂n kapƒ±": "sag_on_kapi",
    "saƒü arka kapƒ±": "sag_arka_kapi",
    "saƒü arka √ßamurluk": "sag_arka_camurluk",

    // ORTA / DIƒûER
    "kaput": "kaput",
    "tavan": "tavan",
    "bagaj": "bagaj",
    "motor kaputu": "kaput",
    "bagaj kapaƒüƒ±": "bagaj",
    "arka bagaj": "bagaj",
    "tamponlar": ["on_tampon", "arka_tampon"],
    "√∂n tampon": "on_tampon",
    "arka tampon": "arka_tampon"
};

const statusMapping = {
    "orjinal": "Orjinal",
    "temiz": "Orjinal",
    "boyalƒ±": "Boyalƒ±",
    "boya": "Boyalƒ±",
    "deƒüi≈üen": "Deƒüi≈üen",
    "deƒüi≈ümi≈ü": "Deƒüi≈üen",
    "lokal": "Lokal Boyalƒ±",
    "lokal boya": "Lokal Boyalƒ±",
    "yarƒ±m boya": "Lokal Boyalƒ±",
    "s√∂k tak": "S√∂k Tak",
    "ayar": "S√∂k Tak",
    "plastik": "Plastik"
};

let recognition;
let isListening = false;
let pendingPart = null; // "sol √∂n kapƒ±" dendi, durum bekleniyor

if (window.SpeechRecognition) {
    recognition = new window.SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false; // Tek komut alƒ±p dursun mu? Hayƒ±r, s√ºrekli dinlesin ama biz toggle yapƒ±caz.
    // continuous=true yaparsak bitmiyor, biz manuel durdurana kadar dinliyor.
    // Kullanƒ±m kolaylƒ±ƒüƒ± i√ßin: Mikrofona bas -> Konu≈ü -> ƒ∞≈üle -> Kapan.

    recognition.onstart = () => {
        isListening = true;
        updateMicVisuals(true);
        showToast("Dinliyorum... (√ñrn: 'Sol √∂n kapƒ± boyalƒ±')", "info");
    };

    recognition.onend = () => {
        isListening = false;
        updateMicVisuals(false);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Ses Algƒ±landƒ±:", transcript);
        processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech Error:", event.error);
        showToast("Ses anla≈üƒ±lamadƒ±: " + event.error, "error");
    };
} else {
    console.warn("Web Speech API bu tarayƒ±cƒ±da desteklenmiyor.");
}

function toggleVoiceRecognition() {
    if (!recognition) return alert("Tarayƒ±cƒ±nƒ±z sesli komutu desteklemiyor (Chrome kullanƒ±n).");

    if (isListening) recognition.stop();
    else recognition.start();
}

function processVoiceCommand(text) {
    // 1. TAM KOMUT: "sol √∂n kapƒ± boyalƒ±"
    // 2. PAR√áALI: √ñnce "Sol √∂n kapƒ±" (se√ßer), sonra "Boyalƒ±" (i≈üler)

    let foundPartKey = null;
    let foundStatus = null;

    // Par√ßa Bul
    for (const [key, val] of Object.entries(partMapping)) {
        if (text.includes(key)) {
            foundPartKey = val;
            break;
        }
    }

    // Durum Bul
    for (const [key, val] of Object.entries(statusMapping)) {
        if (text.includes(key)) {
            foundStatus = val;
            break;
        }
    }

    // --- MANTIK ---
    if (foundPartKey && foundStatus) {
        // Tek seferde: "Sol yan boyalƒ±"
        if (Array.isArray(foundPartKey)) {
            foundPartKey.forEach(key => applyVoiceAction(key, foundStatus));
            showToast(`Grup ƒ∞≈ülemi: ${foundPartKey.length} par√ßa -> ${foundStatus}`, "success");
        } else {
            applyVoiceAction(foundPartKey, foundStatus);
            showToast(`Sesli Komut: ${foundPartKey} -> ${foundStatus}`, "success");
        }
    } else if (foundPartKey) {
        // Sadece par√ßa/grup: "Sol yan"
        if (Array.isArray(foundPartKey)) {
            pendingPart = foundPartKey; // Diziyi sakla
            showToast(`Grup Se√ßildi: ${foundPartKey.length} par√ßa. Durumu s√∂yleyin.`, "info");
        } else {
            selectPartByVoice(foundPartKey);
            pendingPart = foundPartKey;
            showToast(`Par√ßa Se√ßildi: ${foundPartKey}. ≈ûimdi durumu s√∂yleyin.`, "info");
        }
    } else if (foundStatus) {
        // Sadece durum: "Boyalƒ±"
        if (window.selectedPartKey) {
            applyVoiceAction(window.selectedPartKey, foundStatus);
            showToast(`Durum Yollandƒ±: ${foundStatus}`, "success");
        } else if (pendingPart) {
            // Bekleyen par√ßa veya GRUP varsa
            if (Array.isArray(pendingPart)) {
                pendingPart.forEach(key => applyVoiceAction(key, foundStatus));
                showToast(`Grup Uygulandƒ±: ${pendingPart.length} par√ßa -> ${foundStatus}`, "success");
            } else {
                applyVoiceAction(pendingPart, foundStatus);
                showToast(`Durum Uygulandƒ±: ${foundStatus}`, "success");
            }
            pendingPart = null;
        } else {
            showToast("√ñnce bir par√ßa s√∂ylemelisin.", "warning");
        }
    } else {
        showToast("Komut anla≈üƒ±lamadƒ±: " + text, "warning");
    }
}

function applyVoiceAction(partKey, status) {
    // car-render.js i√ßindeki fonksiyonu kullan
    const pathEl = document.getElementById(partKey);
    if (pathEl) {
        // G√∂rsel se√ßim (Grup i≈üleminde hepsini se√ßmek kafa karƒ±≈ütƒ±rabilir, sadece status uygulayalƒ±m)
        // if (window.selectPartForEdit) window.selectPartForEdit(partKey, pathEl); 
        if (window.applyStatusWrapper) window.applyStatusWrapper(partKey, pathEl, status); // ƒ∞≈ülem

        // Animasyon efekti
        pathEl.style.fill = '#fff';
        setTimeout(() => {
            // Rengi geri y√ºkle (applyStatusWrapper zaten yapacak ama g√∂rsel feedback olsun)
        }, 200);
    }
}

function selectPartByVoice(partKey) {
    const pathEl = document.getElementById(partKey);
    if (pathEl && window.selectPartForEdit) {
        window.selectPartForEdit(partKey, pathEl);
    }
}

function updateMicVisuals(isActive) {
    const btn = document.getElementById('btnVoice');
    if (!btn) return;

    if (isActive) {
        btn.classList.add('pulse-animation');
        btn.style.backgroundColor = '#ef4444'; // Red recording
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i> Dinliyor...';
    } else {
        btn.classList.remove('pulse-animation');
        btn.style.backgroundColor = ''; // Default
        btn.innerHTML = '<i class="fas fa-microphone"></i> Sesli Komut';
    }
}

// CSS for pulse
const style = document.createElement('style');
style.innerHTML = `
@keyframes pulse-red {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
.pulse-animation {
    animation: pulse-red 1.5s infinite;
}
`;
document.head.appendChild(style);
È *cascade08Èù *cascade08ù¶*cascade08¶Ø *cascade08ØÕ
 *cascade08Õ
¿*cascade08¿÷ *cascade08÷Ú*cascade08ÚÙ *cascade08Ù˝*cascade08˝ˇ *cascade08ˇà *cascade08à â  *cascade08â ° *cascade08° ¢  *cascade08¢ ß *cascade08ß ®  *cascade08® ≠ *cascade08≠ Æ  *cascade08Æ ª *cascade08ª º  *cascade08º ¬ *cascade08¬ √  *cascade08√ » *cascade08» …  *cascade08… Ã *cascade08Ã Õ  *cascade08Õ ‘ *cascade08‘ ’  *cascade08’ ÷ *cascade08÷ ◊  *cascade08◊ ÿ *cascade08ÿ Ÿ  *cascade08Ÿ Â *cascade08Â Ê  *cascade08Ê ˜ *cascade08˜ ¯  *cascade08¯ ˇ *cascade08ˇ Å! *cascade08Å!Ü!*cascade08Ü!á! *cascade08á!à!*cascade08à!â! *cascade08â!õ!*cascade08õ!ù! *cascade08ù!Ω!*cascade08Ω!æ! *cascade08æ!»!*cascade08»! ! *cascade08 !‡!*cascade08‡!û" *cascade08û"¢"*cascade08¢"Ô" *cascade08Ô"˙"*cascade08˙"Æ# *cascade08Æ#≥#*cascade08≥#º# *cascade08º#æ#*cascade08æ#»# *cascade08»#”#*cascade08”#‘# *cascade08‘#◊#*cascade08◊#Á# *cascade08Á#Í#*cascade08Í#Ï# *cascade08Ï##*cascade08#ì$ *cascade08ì$£$*cascade08£$•$ *cascade08•$©$*cascade08©$º$ *cascade08º$Ω$*cascade08Ω$æ$ *cascade08æ$¿$*cascade08¿$Ÿ$ *cascade08Ÿ$‡$*cascade08‡$·$ *cascade08·$Ë$*cascade08Ë$Í$ *cascade08Í$Î$*cascade08Î$ê% *cascade08ê%ë%*cascade08ë%í% *cascade08í%ì%*cascade08ì%î% *cascade08î%ï%*cascade08ï%ó% *cascade08ó%ö%*cascade08ö%•% *cascade08•%™%*cascade08™%´% *cascade08´%Ø%*cascade08Ø%∞% *cascade08∞%¥%*cascade08¥%µ% *cascade08µ%π%*cascade08π%ª% *cascade08ª%æ%*cascade08æ%ø% *cascade08ø%¬%*cascade08¬%√% *cascade08√%—%*cascade08—%’% *cascade08’%Ÿ%*cascade08Ÿ%⁄% *cascade08⁄%‹%*cascade08‹%›% *cascade08›%·%*cascade08·%‚% *cascade08‚%‰%*cascade08‰%Â% *cascade08Â%Ë%*cascade08Ë%È% *cascade08È%Í%*cascade08Í%Î% *cascade08Î%Ï%*cascade08Ï%Ì% *cascade08Ì%Ô%*cascade08Ô%˘% *cascade08˘%˚%*cascade08˚%¸% *cascade08¸%ê&*cascade08ê&ë& *cascade08ë&ì&*cascade08ì&î& *cascade08î&ñ&*cascade08ñ&ó& *cascade08ó&ò&*cascade08ò&ô& *cascade08ô&ú&*cascade08ú&ù& *cascade08ù&û&*cascade08û&†& *cascade08†&°&*cascade08°&¢& *cascade08¢&£&*cascade08£&§& *cascade08§&¨&*cascade08¨&≠& *cascade08≠&≤&*cascade08≤&µ& *cascade08µ&∑&*cascade08∑&∏& *cascade08∏&º&*cascade08º&Ω& *cascade08Ω&ø&*cascade08ø&¿& *cascade08¿&∆&*cascade08∆&«& *cascade08«&ÿ&*cascade08ÿ&•( *cascade08•(¶(*cascade08¶(˝( *cascade08˝(˚)*cascade08˚)å* *cascade08å*œ**cascade08œ*⁄* *cascade08⁄*Ï**cascade08Ï*Ì* *cascade08Ì*Ô**cascade08Ô*˙* *cascade08˙*á+*cascade08á+ó+ *cascade08ó+¬+*cascade08¬+Õ+ *cascade08Õ+Œ+*cascade08Œ+œ+ *cascade08œ+“+*cascade08“+”+ *cascade08”+ÿ+*cascade08ÿ+Ÿ+ *cascade08Ÿ+€+*cascade08€+ﬁ+ *cascade08ﬁ+‚+*cascade08‚+¶, *cascade08¶,÷,*cascade08÷,»/ *cascade08»/ª0*cascade08ª0Î1 *cascade08Î1Ω3*cascade08Ω3Ò< *cascade082Nfile:///c:/Users/Emmi/Documents/ekspertiz-node/public/js/speech-recognition.js