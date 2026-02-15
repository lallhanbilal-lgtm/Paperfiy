@echo off
echo 🚀 Preparing Paperify for Railway deployment...

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
)\n\nREM Add all files\necho 📁 Adding files to Git...\ngit add .\n\nREM Commit changes\necho 💾 Committing changes...\ngit commit -m \"Deploy to Railway: %date% %time%\"\n\nREM Check if Railway CLI is installed\nrailway --version >nul 2>&1\nif errorlevel 1 (\n    echo ❌ Railway CLI not found. Installing...\n    npm install -g @railway/cli\n)\n\nREM Login to Railway (if not already logged in)\necho 🔐 Checking Railway authentication...\nrailway whoami || railway login\n\nREM Deploy to Railway\necho 🚀 Deploying to Railway...\nrailway up\n\necho ✅ Deployment complete!\necho 🌐 Your app should be available at your Railway domain\necho 📊 Check deployment status: railway status\necho 📝 View logs: railway logs\npause