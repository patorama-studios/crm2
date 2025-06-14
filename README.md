# Patorama Studios CRM - Simplified Version

A custom CRM platform built for Patorama Studios real estate media business, optimized for shared hosting environments.

![Patorama CRM](https://img.shields.io/badge/Patorama-CRM-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)
![Shared Hosting](https://img.shields.io/badge/Shared%20Hosting-Compatible-brightgreen)

## 🚀 Features

- **User Management** - Role-based access control (Super Admin, Team Manager, Content Creator, Editor)
- **Job Scheduling** - Complete job lifecycle management
- **Customer Management** - Agency and contact management
- **Dashboard Analytics** - Real-time stats and metrics
- **Authentication** - Secure JWT-based login system
- **Responsive Design** - Works on desktop and mobile
- **Shared Hosting Compatible** - No native modules, simplified dependencies

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **JWT** authentication
- **CryptoJS** for password hashing (no bcrypt compilation issues)
- **Simple dependencies** - works on shared hosting

### Frontend
- **React** 18+ (pre-built and included)
- **Material-UI** components
- **Responsive design**

## 📋 Prerequisites

- **Shared hosting with Node.js support** (cPanel with Node.js apps)
- **MySQL database**
- **No compilation required** - all dependencies are pure JavaScript

## 🔧 Installation

### 1. Download/Clone the repository
```bash
git clone https://github.com/patorama-studios/crm2.git
```

### 2. Database Setup
Import the database schema: `patorama_crm_simplified_import.sql`

### 3. Upload to Server
Upload all files to your web server (via FTP or cPanel File Manager)

### 4. Configure Node.js App (cPanel)
- **Application Startup File:** `server.js`
- **Application Root:** Your upload directory
- **Node.js Version:** 18.x or higher
- **Run NPM Install** (should work without errors)

## 🌐 Live Demo

- **URL:** https://crm.patorama.com.au
- **Email:** admin@patorama.com.au
- **Password:** PatoramaAdmin2024!

## 🔐 User Roles

### Super Admin
- Full system access
- User management
- System configuration

### Team Manager
- Job creation and assignment
- Customer management
- Team coordination

### Content Creator
- View assigned jobs
- Upload photos/videos
- Update job status

### Editor
- View assigned editing jobs
- Upload edited content
- Mark content as final

## 🗂️ Project Structure

```
crm2/
├── server.js           # Main application (startup file)
├── package.json        # Simplified dependencies
├── .env               # Production configuration
├── config/
│   └── database.js    # MySQL connection
├── middleware/
│   └── auth.js        # Authentication
├── utils/
│   └── auth.js        # Password hashing (CryptoJS)
├── public/            # React frontend (pre-built)
└── uploads/           # File uploads directory
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Jobs
- `GET /api/jobs` - List jobs (filtered by role)
- `GET /api/jobs/:id` - Get job details

### Customers
- `GET /api/customers` - List customers

### Health Check
- `GET /api/health` - Server status

## ⚙️ Configuration

### Environment Variables (.env)
```env
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
```

## 🚀 Deployment Steps

### 1. **Prepare Database**
```sql
-- Import the provided SQL file
mysql -u your_user -p your_database < patorama_crm_simplified_import.sql
```

### 2. **Upload Files**
- Upload all project files to your web server
- Ensure `.env` file has correct database credentials

### 3. **Configure cPanel Node.js App**
- **Startup File:** `server.js`
- **Install Dependencies:** Click "Run NPM Install"
- **Start Application**

### 4. **Test**
- Visit your domain
- Login with admin credentials
- Verify dashboard loads with stats

## ✅ **Why This Version is Better for Shared Hosting:**

- ✅ **No bcrypt** - Uses CryptoJS (pure JavaScript, no compilation)
- ✅ **Minimal dependencies** - Only essential packages
- ✅ **No native modules** - No compilation errors
- ✅ **Smaller package** - Faster uploads and deployments
- ✅ **Same functionality** - All CRM features included
- ✅ **Pre-built frontend** - No build process required

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with CryptoJS
- Input validation
- SQL injection protection

## 🧪 Testing

Access the health endpoint to verify deployment:
```
GET /api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

## 📞 Support

- **GitHub Issues:** [Create an issue](https://github.com/patorama-studios/crm2/issues)
- **Email:** support@patorama.com.au

## 📝 Dependencies (Simplified)

```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.5", 
  "dotenv": "^16.3.1",
  "crypto-js": "^4.2.0",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "express-validator": "^7.0.1",
  "compression": "^1.7.4"
}
```

**All pure JavaScript - no compilation required!**

## 🏗️ Troubleshooting

### Common Issues:

**"Module not found" errors:**
- Run NPM install in cPanel Node.js manager

**Database connection failed:**
- Check .env database credentials
- Ensure database exists and user has permissions

**503 Service errors:**
- Check Node.js app logs in cPanel
- Verify startup file is set to `server.js`

## 📄 License

Private - Patorama Studios

---

## 🎯 **Perfect for Shared Hosting!**

This simplified version eliminates all the common deployment issues with shared hosting providers while maintaining full CRM functionality.

Built with ❤️ by Patorama Studios