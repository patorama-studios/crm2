#!/bin/bash

# Patorama CRM Deployment Script
echo "🚀 Building Patorama CRM for production..."

# Build frontend
echo "📦 Building React frontend..."
cd /Users/patorama/patorama-crm-frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Copy build to backend public directory
echo "📂 Copying frontend build to backend..."
cd /Users/patorama
rm -rf patorama-crm-backend/public
cp -r patorama-crm-frontend/build patorama-crm-backend/public

# Create deployment package
echo "📦 Creating deployment package..."
cd /Users/patorama
rm -rf patorama-crm-deploy
mkdir patorama-crm-deploy

# Copy backend files (excluding node_modules and dev files)
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          --exclude='*.log' \
          --exclude='.env' \
          --exclude='uploads' \
          patorama-crm-backend/ patorama-crm-deploy/

# Copy production environment file
cp patorama-crm-backend/.env.production patorama-crm-deploy/.env

# Create uploads directory
mkdir -p patorama-crm-deploy/uploads

# Create deployment README
cat > patorama-crm-deploy/DEPLOYMENT.md << EOF
# Patorama CRM - Production Deployment

## Server Setup Instructions

1. Upload all files to your web server root directory
2. Install Node.js dependencies:
   \`\`\`bash
   npm install --production
   \`\`\`

3. Import the database schema:
   \`\`\`bash
   mysql -u patoramacom_crm_admin3 -p patoramacom_crm < ../patorama-crm-production-schema.sql
   \`\`\`

4. Set up proper file permissions:
   \`\`\`bash
   chmod 755 uploads/
   chmod +x server.js
   \`\`\`

5. Start the application:
   \`\`\`bash
   # For production (recommended with PM2)
   npm install -g pm2
   pm2 start server.js --name "patorama-crm"
   pm2 startup
   pm2 save
   
   # Or start directly
   npm run production
   \`\`\`

## Production Login
- URL: https://crm.patorama.com.au
- Email: admin@patorama.com.au
- Password: PatoramaAdmin2024!

## File Structure
- /server.js - Main application file
- /routes/ - API endpoints
- /public/ - React frontend build
- /uploads/ - File uploads directory
- /.env - Production environment variables

## Important Notes
- Update API keys in .env file for production services
- Set up SSL certificate for HTTPS
- Configure domain to point to Node.js application
- Set up regular database backups
EOF

echo "✅ Deployment package created in: /Users/patorama/patorama-crm-deploy"
echo "📄 MySQL import file ready: /Users/patorama/patorama-crm-production-schema.sql"
echo ""
echo "🔗 Next steps:"
echo "1. Import the MySQL schema file into your database"
echo "2. Upload the patorama-crm-deploy folder to your server"
echo "3. Follow the instructions in DEPLOYMENT.md"
echo ""
echo "🔐 Production Login:"
echo "   URL: https://crm.patorama.com.au"
echo "   Email: admin@patorama.com.au"
echo "   Password: PatoramaAdmin2024!"