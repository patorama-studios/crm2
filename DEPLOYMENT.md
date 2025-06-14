# Simplified Deployment Guide - Patorama CRM

## 🎯 **Quick Deployment for cPanel/Shared Hosting**

### **Step 1: Import Database**
1. Download: `patorama_crm_simplified_import.sql` from Desktop
2. In cPanel → phpMyAdmin → Select `patoramacom_crm` database
3. Click "Import" → Choose file → Import
4. ✅ Verify tables are created

### **Step 2: Stop Current Node.js App**
1. cPanel → Node.js Apps
2. Stop the current application
3. Delete old files (backup if needed)

### **Step 3: Download Latest Code**
```bash
# Option 1: Download ZIP from GitHub
https://github.com/patorama-studios/crm2/archive/main.zip

# Option 2: Git clone (if available)
git clone https://github.com/patorama-studios/crm2.git
```

### **Step 4: Upload Files**
Upload ALL files from the repository to your server:
- Using FTP client (FileZilla)
- Or cPanel File Manager
- Upload to your domain's root directory

**Key files to verify:**
- ✅ server.js (startup file)
- ✅ package.json (dependencies)
- ✅ .env (database config)
- ✅ config/ folder
- ✅ middleware/ folder
- ✅ utils/ folder
- ✅ public/ folder (React app)
- ✅ uploads/ folder

### **Step 5: Configure Node.js App**
1. cPanel → Node.js Apps → Create New App
2. **Startup File:** `server.js`
3. **Application Root:** Your upload directory
4. **Node.js Version:** 18.x or latest
5. Click **"Create"**

### **Step 6: Install Dependencies**
1. In Node.js App settings
2. Click **"Run NPM Install"**
3. Wait for installation (should complete without errors)
4. ✅ Verify no bcrypt errors this time!

### **Step 7: Start Application**
1. Click **"Start App"**
2. Status should show "Running"

### **Step 8: Test**
1. Visit: https://crm.patorama.com.au
2. Should see login page (not file directory)
3. Login: admin@patorama.com.au / PatoramaAdmin2024!
4. ✅ Dashboard should load with stats

## 🔧 **Environment Configuration**

Verify your `.env` file has correct settings:

```env
# Production Configuration
PORT=3001
NODE_ENV=production

# Database (update if needed)
DB_HOST=localhost
DB_PORT=3306
DB_USER=patoramacom_crm_admin3
DB_PASSWORD=Y[x8iq_OP=$J
DB_NAME=patoramacom_crm

# JWT Secret
JWT_SECRET=patorama_crm_production_secret_key_2024_secure
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://crm.patorama.com.au
```

## ✅ **What's Fixed in This Version:**

- ❌ **No more bcrypt errors** - Uses CryptoJS instead
- ❌ **No more compilation issues** - Pure JavaScript only
- ❌ **No more 503 errors** - Simplified dependencies
- ✅ **Works on shared hosting** - No native modules
- ✅ **Same functionality** - Full CRM features
- ✅ **Faster deployment** - Smaller package

## 🚨 **Troubleshooting:**

### **Still getting file directory listing?**
- Check Node.js app is running in cPanel
- Verify startup file is set to `server.js`
- Check app logs for errors

### **Database connection errors?**
- Verify database credentials in .env
- Test database connection in phpMyAdmin
- Check database user permissions

### **NPM install fails?**
- This version should NOT fail
- Check Node.js version (use 18.x+)
- Contact hosting provider if issues persist

### **Login not working?**
- Clear browser cache
- Check API endpoint: /api/health
- Verify database has users table with admin account

## 📞 **Support:**

If you still have issues:
1. Check Node.js app logs in cPanel
2. Test API health: https://crm.patorama.com.au/api/health
3. Contact hosting provider about Node.js support

## 🎉 **Success Indicators:**

✅ **Website loads** (not file listing)  
✅ **Login page appears**  
✅ **Can login with admin account**  
✅ **Dashboard shows stats**  
✅ **No console errors**  

---

**This simplified version should work perfectly on your shared hosting! 🚀**