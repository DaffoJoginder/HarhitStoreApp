# Quick Start Guide

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Quick Setup (Automated)

Run the setup script:

```bash
./setup.sh
```

Or on Windows:
```bash
bash setup.sh
```

## Manual Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Database Setup

#### Create PostgreSQL Database

```bash
# Using createdb command
createdb instamart_db

# Or using psql
psql -U postgres
CREATE DATABASE instamart_db;
\q
```

#### Configure Database Connection

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/instamart_db?schema=public"
```

Replace `username` and `password` with your PostgreSQL credentials.

#### Run Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### 3. Environment Configuration

#### Backend (.env)
The file `backend/.env` should already exist. Update it with your database credentials if needed.

#### Frontend (.env.local)
The file `frontend/.env.local` should already exist with:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 4. Create Uploads Directory

```bash
mkdir -p backend/uploads
```

## Running the Application

### Option 1: Run Both Together (Recommended)

From the root directory:
```bash
npm run dev
```

This starts:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Verify Installation

1. **Backend Health Check:**
   Open http://localhost:3001/health
   Should return: `{"status":"ok","message":"Instamart API is running"}`

2. **Frontend:**
   Open http://localhost:3000
   Should see the landing page with B2C/B2B options

## Create Admin User (Optional)

You can create an admin user using Prisma Studio:

```bash
cd backend
npx prisma studio
```

Or using SQL:

```sql
-- First, generate a password hash using Node.js:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"

-- Then insert (replace <hashed_password> with the hash):
INSERT INTO users (id, full_name, email, mobile, password_hash, account_type, status, email_verified, mobile_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@instamart.com',
  '9999999999',
  '<hashed_password>',
  'admin',
  'active',
  true,
  true,
  NOW(),
  NOW()
);
```

## Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
1. Ensure PostgreSQL is running:
   ```bash
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   
   # Windows
   # Start PostgreSQL service from Services
   ```

2. Check DATABASE_URL in `backend/.env`
3. Verify database exists: `psql -l | grep instamart_db`

### Port Already in Use

**Error:** `Port 3000 or 3001 already in use`

**Solution:**
1. Change port in `backend/.env`: `PORT=3002`
2. Update `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1`
3. Or kill the process using the port:
   ```bash
   # Find process
   lsof -i :3001
   # Kill process
   kill -9 <PID>
   ```

### Prisma Errors

**Error:** `Prisma Client not generated`

**Solution:**
```bash
cd backend
npx prisma generate
```

**Error:** `Migration failed`

**Solution:**
```bash
cd backend
npx prisma migrate reset  # WARNING: This deletes all data
npx prisma migrate dev
```

### Module Not Found

**Error:** `Cannot find module`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### File Upload Issues

**Error:** `ENOENT: no such file or directory, open 'uploads/...'`

**Solution:**
```bash
mkdir -p backend/uploads
```

## Development Commands

### Backend
```bash
cd backend

# Development server
npm run dev

# Build
npm run build

# Production server
npm start

# Database
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev     # Create migration
npx prisma generate        # Generate Prisma Client
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Build
npm run build

# Production server
npm start

# Lint
npm run lint
```

## Project Structure

```
Grocery-App/
├── backend/              # Express.js API
│   ├── src/
│   ├── prisma/
│   ├── uploads/          # File uploads
│   └── .env             # Backend config
├── frontend/            # Next.js App
│   ├── src/
│   └── .env.local      # Frontend config
└── package.json         # Root package.json
```

## API Endpoints

Once running, test the API:

```bash
# Health check
curl http://localhost:3001/health

# Get categories
curl http://localhost:3001/api/v1/categories
```

## Next Steps

1. ✅ Set up database
2. ✅ Run migrations
3. ✅ Start servers
4. 📝 Create admin user
5. 🧪 Test API endpoints
6. 🎨 Build frontend UI components

## Need Help?

- Check `SETUP.md` for detailed setup instructions
- Check `backend/README.md` for API documentation
- Check `PROJECT_SUMMARY.md` for feature overview

