# 🚀 Run Instructions

## Quick Start (3 Steps)

### Step 1: Set Up Database

**Option A: Automated (Recommended)**
```bash
./init-db.sh
```

**Option B: Manual**
```bash
# Create database
createdb instamart_db

# Or using psql
psql -U postgres
CREATE DATABASE instamart_db;
\q

# Update backend/.env with your database credentials
# Then run migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### Step 2: Configure Environment

The scripts will create `.env` files automatically. If you need to create them manually:

**backend/.env:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/instamart_db?schema=public"
JWT_SECRET="instamart-super-secret-jwt-key-change-in-production-2025"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880
FRONTEND_URL="http://localhost:3000"
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Step 3: Run the Application

**Option A: Run Both Together (Recommended)**
```bash
./run.sh
```

**Option B: Using npm**
```bash
npm run dev
```

**Option C: Run Separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Health Check:** http://localhost:3001/health
- **Prisma Studio:** `cd backend && npx prisma studio`

## Verify Everything Works

1. **Check Backend:**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok","message":"Instamart API is running"}`

2. **Check Frontend:**
   Open http://localhost:3000 in your browser
   Should see the landing page

3. **Test API:**
   ```bash
   curl http://localhost:3001/api/v1/categories
   ```

## Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Solutions:**
1. Ensure PostgreSQL is running:
   ```bash
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. Check DATABASE_URL in `backend/.env`
3. Verify database exists: `psql -l | grep instamart_db`

### Port Already in Use

**Error:** `Port 3000 or 3001 already in use`

**Solutions:**
1. Kill the process:
   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```

2. Or change ports in `.env` files

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
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma migrate dev
```

### Module Not Found

**Solution:**
```bash
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Development Commands

### Backend
```bash
cd backend

# Development
npm run dev

# Build
npm run build

# Production
npm start

# Database
npx prisma studio
npx prisma migrate dev
npx prisma generate
```

### Frontend
```bash
cd frontend

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Create Admin User

After setting up the database, create an admin user:

```bash
cd backend

# Generate password hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"

# Then use Prisma Studio or SQL to insert:
npx prisma studio
```

Or using SQL:
```sql
-- Replace <hashed_password> with the hash from above
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

## Project Structure

```
Grocery-App/
├── backend/              # Express.js API
│   ├── src/
│   ├── prisma/
│   ├── uploads/
│   └── .env
├── frontend/            # Next.js App
│   ├── src/
│   └── .env.local
├── run.sh               # Run both servers
├── init-db.sh           # Database setup
└── package.json
```

## Need Help?

- **QUICK_START.md** - Detailed setup guide
- **SETUP.md** - Complete setup instructions
- **backend/README.md** - API documentation
- **PROJECT_SUMMARY.md** - Feature overview

