ä@echo off
title Ekspertiz Yonetim Paneli
echo Ekspertiz Uygulamasi Baslatiliyor...
echo.

:: Try to switch to the script directory
cd /d "%~dp0"
if errorlevel 1 (
    echo Calisma dizinine gecilemedi, mevcut dizinden devam ediliyor...
)

:: Kill existing node processes (risky if user has other node apps, but effective here)
:: taskkill /F /IM node.exe /FI "WINDOWTITLE eq Ekspertiz Yonetim Paneli" >nul 2>&1

call npm start

if errorlevel 1 (
    echo.
    echo Bir hata olustu.
    echo Eger "address already in use" hatasi goruyorsaniz, onceki "node.exe" islemlerini kapatin.
    pause
) *cascade08+*cascade08+] *cascade08]‰*cascade08‰– *cascade08–§*cascade08§¹ *cascade08¹»*cascade08»ñ *cascade08ñÕ*cascade08Õä *cascade082<file:///c:/Users/Emmi/Documents/ekspertiz-node/START-APP.BAT