@echo off
setlocal
cd /d "%~dp0"
set "TASKEASY_PRESENTATION_NODE=node"
if exist "runtime\node.exe" set "TASKEASY_PRESENTATION_NODE=%~dp0runtime\node.exe"
"%TASKEASY_PRESENTATION_NODE%" --version >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Use o pacote local completo ou instale Node.js 20.20.0.
  pause
  exit /b 1
)
if not exist "api\node_modules\express\package.json" (
  echo Dependencias ausentes. Na raiz do projeto, execute npm.cmd ci --prefix api.
  pause
  exit /b 1
)
"%TASKEASY_PRESENTATION_NODE%" "api\scripts\setup.js"
if errorlevel 1 (
  echo Nao foi possivel preparar a configuracao local.
  pause
  exit /b 1
)
"%TASKEASY_PRESENTATION_NODE%" "api\scripts\presentation.js"
set "TASKEASY_PRESENTATION_EXIT=%ERRORLEVEL%"
echo.
pause
exit /b %TASKEASY_PRESENTATION_EXIT%
