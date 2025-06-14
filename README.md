# Patorama Studios CRM

A custom CRM platform built for Patorama Studios real estate media business, focusing on job management, customer relationships, and team coordination.

![Patorama CRM](https://img.shields.io/badge/Patorama-CRM-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)

## 🚀 Features

- **User Management** - Role-based access control (Super Admin, Team Manager, Content Creator, Editor)
- **Job Scheduling** - Complete job lifecycle management
- **Customer Management** - Agency and contact management
- **File Upload System** - Secure media file handling
- **Invoice Generation** - Integration ready for Xero
- **Payment Processing** - Stripe integration ready
- **Team Notifications** - Real-time updates and assignments
- **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **JWT** authentication
- **Multer** for file uploads
- **bcrypt** for password hashing

### Frontend
- **React** 18+
- **Material-UI** components
- **React Router** for navigation
- **Axios** for API calls

### Integrations (Ready)
- **Stripe** for payments
- **Xero** for invoicing
- **Box.com** for file storage
- **Google Calendar** for scheduling
- **Go High Level** for CRM

## 📋 Prerequisites

- Node.js 16 or higher
- MySQL 8.0 or higher
- npm or yarn

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/patorama-studios/crm2.git
cd crm2
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

### 5. Set up the database
```bash
mysql -u root -p < patorama-crm-production-schema.sql
```

## 🚀 Development

### Start backend server
```bash
npm run dev
```

### Start frontend (in another terminal)
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🌐 Production Deployment

### Build for production
```bash
./deploy.sh
```

### Deploy to server
```bash
# Upload files via FTP or SCP
# Import database schema
# Install dependencies: npm install --production
# Start with PM2: pm2 start server.js --name patorama-crm
```

## 🔐 Default Login

- **URL:** https://crm.patorama.com.au
- **Email:** admin@patorama.com.au
- **Password:** PatoramaAdmin2024!

## 📊 User Roles

### Super Admin
- Full system access
- User management
- System configuration

### Team Manager
- Job creation and assignment
- Customer management
- Team coordination
- Reports access

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
├── backend/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & validation
│   ├── routes/         # API endpoints
│   ├── config/         # Database config
│   └── server.js       # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API integration
│   │   └── context/    # React context
│   └── public/         # Static files
├── uploads/            # File uploads
└── patorama-crm-production-schema.sql
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/jobs` - List jobs (filtered by role)
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PATCH /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PATCH /api/customers/:id` - Update customer

### File Uploads
- `POST /api/uploads` - Upload files
- `GET /api/uploads/job/:jobId` - Get job uploads
- `PATCH /api/uploads/:id` - Mark as final
- `DELETE /api/uploads/:id` - Delete upload

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- File upload validation
- SQL injection protection
- XSS protection with Helmet.js

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=patorama_crm

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# External APIs
STRIPE_SECRET_KEY=sk_test_...
XERO_CLIENT_ID=...
BOX_CLIENT_ID=...
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

Private - Patorama Studios

## 🆘 Support

For support and questions:
- Email: support@patorama.com.au
- GitHub Issues: [Create an issue](https://github.com/patorama-studios/crm2/issues)

## 🗓️ Roadmap

- [ ] Real-time notifications with WebSockets
- [ ] Advanced reporting dashboard
- [ ] Mobile app for content creators
- [ ] AI-powered image/video processing
- [ ] Automated workflow triggers
- [ ] Customer portal
- [ ] Integration with more external services

---

Built with ❤️ by Patorama Studios