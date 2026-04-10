# Deployment Checklist for NEXUS Event Management

## Pre-Deployment Setup ✓

### 1. GitHub Repository
- [ ] Create GitHub repository: https://github.com/new
- [ ] Clone to your machine
- [ ] Copy NEXUS files to repository
- [ ] Create `.gitignore` (already done)
- [ ] Commit and push initial code

```bash
git init
git add .
git commit -m "Initial NEXUS CMS setup"
git branch -M main
git remote add origin https://github.com/your-username/nexus-event-management.git
git push -u origin main
```

### 2. Environment Variables (Already Configured)
- [x] MongoDB URI: `mongodb+srv://nikhilkatigarwork_db_user:XzEwDagyjeY3OXbd@cluster0.kiueas6.mongodb.net`
- [x] `.env` file created locally
- [x] `.env.example` created for reference
- [ ] Change JWT_SECRET to a strong random string

Generate a strong JWT_SECRET:
```bash
# On Windows PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

Or generate online: https://generate-random.org/

Example strong secret:
```
aB3cD4eF5gH6iJ7kL8mN9oPqRsT0uVwXyZ
```

### 3. Deploy on Render

#### Step 1: Create Render Account
- Go to https://render.com
- Sign up with GitHub
- Authorize GitHub access

#### Step 2: Create Web Service
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository
4. Select NEXUS repository

#### Step 3: Configure Web Service
- **Name**: `nexus-cms` (or your preferred name)
- **Region**: Select closest to your users
  - India: Singapore
  - Europe: Frankfurt
  - USA: Oregon
- **Branch**: `main`
- **Build Command**: 
  ```
  npm install
  ```
- **Start Command**: 
  ```
  npm start
  ```
- **Instance Type**: 
  - Free (0.5 CPU, 512MB RAM) - for testing
  - Paid ($7+) - recommended for production

#### Step 4: Add Environment Variables
In Render dashboard, go to "Environment" and add:

```
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb+srv://nikhilkatigarwork_db_user:XzEwDagyjeY3OXbd@cluster0.kiueas6.mongodb.net/nexus?retryWrites=true&w=majority
JWT_SECRET=your_strong_random_string_here
```

⚠️ **IMPORTANT**: Change JWT_SECRET to a random string for security!

#### Step 5: Deploy
- Click "Create Web Service"
- Wait 5-10 minutes for build
- Check deployment logs
- When complete, you'll get a URL like: `https://nexus-cms.onrender.com`

### 4. Test Deployment

#### Test Health Endpoint
```bash
curl https://your-render-url.onrender.com/api/health
# Expected response: {"ok":true,"service":"nexus-backend"}
```

#### Test Frontend
- Homepage: `https://your-render-url.onrender.com/`
- Registration: `https://your-render-url.onrender.com/register.html`
- CMS Login: `https://your-render-url.onrender.com/cms/login.html`

#### Test API Endpoints
```bash
# Get events
curl https://your-render-url.onrender.com/api/public/events

# Test registration submission
curl -X POST https://your-render-url.onrender.com/api/public/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "college": "Test College",
    "email": "test@college.edu",
    "leader": "Test Leader",
    "event": "FINVERSE",
    "participants": [
      {"name": "P1", "phone": "0000", "department": "HR"},
      {"name": "P2", "phone": "0000", "department": "HR"},
      {"name": "P3", "phone": "0000", "department": "Marketing"},
      {"name": "P4", "phone": "0000", "department": "Marketing"},
      {"name": "P5", "phone": "0000", "department": "Finance"}
    ]
  }'
```

### 5. Access CMS
- URL: `https://your-render-url.onrender.com/cms/login.html`
- Default Credentials:
  - Username: `admin`
  - Password: `nexus2026`

### 6. Domain Configuration (Optional)
1. Go to Render dashboard
2. Select your service
3. Go to "Settings" → "Custom Domain"
4. Add your custom domain
5. Update DNS records at your domain provider

## MongoDB Connection Details

**Connection String**:
```
mongodb+srv://nikhilkatigarwork_db_user:XzEwDagyjeY3OXbd@cluster0.kiueas6.mongodb.net/nexus?retryWrites=true&w=majority
```

**Database**: `nexus`
**Collections**:
- `users` - CMS users
- `registrations` - Team registrations
- `settings` - Event settings
- `timelines` - Event timeline
- `scoresheets` - Event scores
- `auditlogs` - Activity logs

**Dashboard**: https://cloud.mongodb.com/

## Troubleshooting

### Build Fails
**Check**:
- Node version (must be 14+)
- All dependencies in `package.json`
- No syntax errors in code
- `.env` variables are set

**Fix**:
- View build logs in Render dashboard
- Check for missing packages: `npm install`

### Application Crashes
**Check**:
- MongoDB connection string is correct
- JWT_SECRET is set
- PORT=4000 environment variable exists
- Check application logs in Render

**Fix**:
```bash
# Redeploy
# Go to Render dashboard → Manual Deploy
```

### CORS/Connection Errors
**Check**:
- Frontend and backend on same domain (Render solves this)
- API endpoints configured correctly
- Network requests going to correct URL

**Fix**:
- Verify deployment URL
- Check browser console for errors
- Verify API routes exist

### MongoDB Connection Issues
**Check**:
- Connection string is correct
- IP whitelist on MongoDB Atlas
  - Go to MongoDB → Network Access
  - Add IP: 0.0.0.0/0 (or specific Render IPs)
- Database name is `nexus`

**Fix**:
1. Go to MongoDB Atlas dashboard
2. Network Access
3. Add IP whitelist for Render region

## Post-Deployment

### Monitor Logs
- Go to Render dashboard
- Select your service
- View "Logs" in real-time

### Enable Auto-Deploys
- Repository settings
- Connected services
- Enable GitHub auto-deploy on push

### Backups
- MongoDB Atlas automatic backups (enabled by default)
- Download backups from MongoDB dashboard monthly

### Database Management
- Access MongoDB directly: https://cloud.mongodb.com/
- Export data: MongoDB Atlas → Tools → Export Collection
- Import data: MongoDB Atlas → Tools → Import Collection

## Cost Estimate

| Component | Free Tier | Paid Tier |
|-----------|-----------|-----------|
| Render Web Service | Free (512MB) | $7+/month |
| MongoDB Atlas | Free (512MB storage) | Free unless exceed |
| Custom Domain | $$ | Included with Render |
| Bandwidth | Sufficient for testing | Sufficient for production |
| **Total** | Free | $7+/month |

## Important Notes

⚠️ **Security**:
- Never commit `.env` to Git
- Use strong JWT_SECRET (minimum 32 chars)
- Keep MongoDB credentials secure
- Enable MongoDB IP whitelist

⚠️ **Production Checklist**:
- [ ] Change JWT_SECRET to random string
- [ ] Test all funcionality after deployment
- [ ] Check MongoDB Atlas backups enabled
- [ ] Monitor error logs regularly
- [ ] Set up email notifications for errors

⚠️ **Maintenance**:
- [ ] Monthly backup of database
- [ ] Review and clean old registrations
- [ ] Monitor server logs
- [ ] Update dependencies monthly
- [ ] Test registration flow weekly

## Next Steps

1. ✅ Configure environment variables (DONE)
2. ⏳ Push code to GitHub
3. ⏳ Connect Render to GitHub
4. ⏳ Deploy on Render
5. ⏳ Test all features
6. ⏳ Share with users: `https://your-render-url.onrender.com`

---

**Need Help?**
- Render Docs: https://render.com/docs
- MongoDB Docs: https://docs.mongodb.com
- Express Docs: https://expressjs.com
