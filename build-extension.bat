@echo off
REM Build script untuk Octra Extension dengan dApp integration
REM Usage: build-extension.bat

echo 🚀 Building Octra Extension with dApp Integration...

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed. Please install Node.js and npm first.
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory.
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies.
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
)

REM Build the React application
echo [INFO] Building React application...

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed. Please check the error messages above.
    exit /b 1
)
echo [SUCCESS] React application built successfully

REM Create extension directory
set EXTENSION_DIR=extension-build
echo [INFO] Creating extension build directory...

if exist "%EXTENSION_DIR%" (
    rmdir /s /q "%EXTENSION_DIR%"
)
mkdir "%EXTENSION_DIR%"

REM Copy built files
echo [INFO] Copying built files...
xcopy /e /i /y "dist\*" "%EXTENSION_DIR%\"

REM Copy extension specific files
echo [INFO] Copying extension files...
copy /y "extensionFiles\manifest.json" "%EXTENSION_DIR%\"
copy /y "extensionFiles\background.js" "%EXTENSION_DIR%\"
copy /y "extensionFiles\content.js" "%EXTENSION_DIR%\"
copy /y "extensionFiles\popup.html" "%EXTENSION_DIR%\"
copy /y "extensionFiles\provider.js" "%EXTENSION_DIR%\"

REM Copy icons
if exist "extensionFiles\icons" (
    xcopy /e /i /y "extensionFiles\icons" "%EXTENSION_DIR%\icons\"
) else (
    echo [WARNING] Icons directory not found. Extension will use default icons.
)

REM Copy SDK files untuk distribution
echo [INFO] Copying SDK files...
copy /y "octra-sdk.js" "%EXTENSION_DIR%\"
copy /y "octra-sdk-demo.html" "%EXTENSION_DIR%\"

REM Copy documentation
echo [INFO] Copying documentation...
copy /y "OCTRA-SDK-README.md" "%EXTENSION_DIR%\"
copy /y "INTEGRATION-GUIDE.md" "%EXTENSION_DIR%\"

REM Create popup.html if it doesn't exist
if not exist "%EXTENSION_DIR%\popup.html" (
    echo [INFO] Creating popup.html...
    (
        echo ^<!DOCTYPE html^>
        echo ^<html lang="en"^>
        echo ^<head^>
        echo     ^<meta charset="UTF-8"^>
        echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
        echo     ^<title^>Octra Wallet^</title^>
        echo     ^<style^>
        echo         body {
        echo             width: 350px;
        echo             height: 500px;
        echo             margin: 0;
        echo             padding: 0;
        echo             font-family: system-ui, -apple-system, sans-serif;
        echo         }
        echo         iframe {
        echo             width: 100%%;
        echo             height: 100%%;
        echo             border: none;
        echo         }
        echo     ^</style^>
        echo ^</head^>
        echo ^<body^>
        echo     ^<iframe src="index.html"^>^</iframe^>
        echo ^</body^>
        echo ^</html^>
    ) > "%EXTENSION_DIR%\popup.html"
    echo [SUCCESS] popup.html created
)

REM Create development package (uncompressed)
set DEV_DIR=extension-dev
if exist "%DEV_DIR%" (
    rmdir /s /q "%DEV_DIR%"
)
xcopy /e /i /y "%EXTENSION_DIR%" "%DEV_DIR%\"
echo [SUCCESS] Development build created in %DEV_DIR%

REM Print summary
echo.
echo ==============================================
echo [SUCCESS] Build completed successfully!
echo ==============================================
echo.
echo 📁 Files created:
echo    • %EXTENSION_DIR%\ - Production build
echo    • %DEV_DIR%\ - Development build (for loading unpacked)
echo.
echo 🔧 Next steps:
echo    1. For development: Load '%DEV_DIR%' as unpacked extension in Chrome
echo    2. Open Chrome and go to chrome://extensions/
echo    3. Enable "Developer mode" in the top right
echo    4. Click "Load unpacked" and select the '%DEV_DIR%' folder
echo    5. Test with demo-dapp.html in the build directory
echo.
echo 📚 Documentation:
echo    • README.md - Main documentation
echo    • SDK_DOCUMENTATION.md - SDK API reference
echo    • demo-dapp.html - Integration example
echo.
echo 🌐 SDK Distribution:
echo    • octra-sdk.js - JavaScript SDK for dApp developers
echo    • octra-sdk.d.ts - TypeScript definitions
echo.
echo [SUCCESS] Build process completed! 🎉
pause