@echo off
cd /d "%~dp0"
npm install --legacy-peer-deps --no-fund --no-audit --progress=false
npm run dev
