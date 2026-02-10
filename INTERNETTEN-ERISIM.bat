�@echo off
chcp 65001
echo.
echo ================================================================
echo   OTO EKSPERTİZ - İNTERNET ERİŞİMİ (MOBİL VERİ)
echo ================================================================
echo.
echo 1. Bu pencere açık kaldığı sürece internetten erişim sağlanabilir.
echo 2. Birazdan aşağıda bir link çıkacak (.trycloudflare.com ile biten).
echo 3. O linki telefona gönderip girebilirsiniz.
echo.
echo NOT: Uygulamanın (server) arka planda çalışıyor olması gerekir.
echo.
echo Tünel başlatılıyor...
echo.

powershell -ExecutionPolicy Bypass -Command "npx cloudflared tunnel --url http://localhost:5000"

pause
�*cascade082Efile:///c:/Users/Emmi/Documents/ekspertiz-node/INTERNETTEN-ERISIM.bat