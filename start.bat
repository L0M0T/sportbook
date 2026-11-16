@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title SportBook

set "NODE_VERSION=v22.14.0"
set "NODE_DIR=%~dp0.node"

where node >nul 2>nul
if not errorlevel 1 goto node_ready

if exist "%NODE_DIR%\node.exe" goto use_local_node

echo.
echo   Node.js не найден - скачиваю portable-версию %NODE_VERSION%
echo   Это нужно только при первом запуске, примерно 30 МБ.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-win-x64.zip' -OutFile '.node.zip'; Expand-Archive -Path '.node.zip' -DestinationPath '.node-tmp' -Force; Move-Item '.node-tmp\node-%NODE_VERSION%-win-x64' '.node'; Remove-Item '.node.zip' -Force; Remove-Item '.node-tmp' -Recurse -Force"

if not exist "%NODE_DIR%\node.exe" (
  echo.
  echo   Не удалось скачать Node.js.
  echo   Проверьте интернет или установите вручную: https://nodejs.org/ (кнопка LTS)
  echo.
  pause
  exit /b 1
)

:use_local_node
set "PATH=%NODE_DIR%;%PATH%"

:node_ready
echo   Node.js:
node -v

if not exist "node_modules" (
  echo.
  echo   Устанавливаю зависимости. Первый раз это занимает 1-2 минуты...
  call npm install
  if errorlevel 1 goto fail
)

if not exist ".env" (
  echo   Создаю .env из .env.example
  copy ".env.example" ".env" >nul
)

if not exist "prisma\dev.db" (
  echo   Готовлю базу данных...
  call npx prisma migrate deploy
  if errorlevel 1 goto fail
  call npm run db:seed
  if errorlevel 1 goto fail
)

if /i "%~1"=="--check" (
  echo.
  echo   Проверка окружения пройдена.
  exit /b 0
)

echo.
echo   Запускаю SportBook на http://localhost:3000
echo   Сервер работает в отдельном окне, закройте его для остановки.
echo.
start "SportBook server" cmd /k "npm run dev"
timeout /t 6 /nobreak >nul
start "" http://localhost:3000
exit /b 0

:fail
echo.
echo   Что-то пошло не так. Скопируйте текст ошибки выше.
echo.
pause
exit /b 1
