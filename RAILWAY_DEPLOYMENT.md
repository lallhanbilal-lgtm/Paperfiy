# Railway Deployment Guide for Paperify

## Prerequisites
1. Railway account (https://railway.app)
2. GitHub account
3. Git installed on your machine

## Deployment Steps

### 1. Prepare Your Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit for Railway deployment"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/paperify.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Railway

#### Option A: Deploy from GitHub
1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Paperify repository
5. Railway will automatically detect it's a Node.js project

#### Option B: Deploy using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Environment Variables
Set these environment variables in Railway dashboard:

```
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here-make-it-long-and-random
SUPERUSER_EMAIL=bilal@paperify.com
PAYMENT_NUMBER=03448007154
```

### 4. Domain Configuration
1. Go to your Railway project dashboard
2. Click on "Settings"
3. Under "Domains", add a custom domain or use the provided railway.app domain

### 5. Database Setup
Railway will automatically handle file storage, but for production you might want to:
1. Add a PostgreSQL database service
2. Update the database configuration in your app

## Important Files for Railway

- `railway.json` - Railway configuration
- `Procfile` - Process configuration
- `.railwayignore` - Files to ignore during deployment
- `package.json` - Dependencies and scripts

## Post-Deployment Checklist

✅ App is accessible via Railway URL
✅ Environment variables are set
✅ File uploads work (payment screenshots)
✅ Database operations work
✅ Session management works
✅ Payment system functions

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check `package.json` dependencies
   - Ensure Node.js version compatibility

2. **App Crashes**
   - Check Railway logs: `railway logs`
   - Verify environment variables

3. **File Upload Issues**
   - Railway has ephemeral storage
   - Consider using cloud storage (AWS S3, Cloudinary)

4. **Database Issues**
   - SQLite files are ephemeral on Railway
   - Consider PostgreSQL for production

### Monitoring
- Use Railway dashboard to monitor:
  - CPU usage
  - Memory usage
  - Request logs
  - Error logs

## Production Recommendations

1. **Database**: Migrate to PostgreSQL
2. **File Storage**: Use cloud storage service
3. **Monitoring**: Set up error tracking
4. **Backup**: Regular data backups
5. **Security**: Enable HTTPS (automatic on Railway)

## Support
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create issues in your repository

---

**Note**: Railway provides automatic HTTPS, so your app will be secure by default.