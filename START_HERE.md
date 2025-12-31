# 🚀 START HERE - Instamart B2B & B2C MVP

## ✅ What's Ready

- ✅ All backend APIs implemented
- ✅ Database schema designed
- ✅ Frontend structure ready
- ✅ Dependencies installed
- ✅ Configuration files created

## 🎯 Quick Start (3 Commands)

### 1. Set Up Database

```bash
./init-db.sh
```

This will:
- Create PostgreSQL database
- Configure `backend/.env`
- Run database migrations
- Generate Prisma Client

**OR Manual Setup:**
```bash
# Create database
createdb instamart_db

# Update backend/.env with your database credentials
# Then:
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### 2. Start the Application

```bash
./run.sh
```

**OR:**
```bash
npm run dev
```

This starts:
- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:3000

### 3. Verify It Works

Open http://localhost:3000 in your browser

Test API:
```bash
curl http://localhost:3001/health
```

## 📋 Prerequisites

- ✅ **Node.js 18+** - You have: `v22.17.1` ✅
- ✅ **PostgreSQL 14+** - Installed ✅
- ✅ **npm** - You have: `10.9.2` ✅

## 🔧 Configuration

### Database Connection

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/instamart_db?schema=public"
```

**Default (if using init-db.sh):**
- Username: `postgres`
- Password: `postgres`
- Database: `instamart_db`
- Host: `localhost`
- Port: `5432`

### Frontend API URL

`frontend/.env.local` is already configured:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 🗄️ Database Setup Options

### Option 1: Automated (Recommended)
```bash
./init-db.sh
```

### Option 2: Manual
```bash
# 1. Create database
createdb instamart_db

# 2. Update backend/.env with credentials

# 3. Run migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### Option 3: Using Docker (if you have Docker)
```bash
docker run --name instamart-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=instamart_db \
  -p 5432:5432 \
  -d postgres:14

# Then run migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

## 🏃 Running the Application

### Run Both Together
```bash
./run.sh
# OR
npm run dev
```

### Run Separately

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

## 🧪 Testing the Setup

### 1. Check Backend
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok","message":"Instamart API is running"}`

### 2. Check Frontend
Open http://localhost:3000
Should see landing page with B2C/B2B options

### 3. Test API Endpoints
```bash
# Get categories
curl http://localhost:3001/api/v1/categories

# Get products (B2C)
curl "http://localhost:3001/api/v1/products?account_type=b2c"
```

## 👤 Create Admin User

After database is set up:

```bash
cd backend

# Generate password hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"

# Copy the hash, then use Prisma Studio:
npx prisma studio
```

In Prisma Studio:
1. Go to `users` table
2. Click "Add record"
3. Fill in:
   - `full_name`: Admin User
   - `email`: admin@instamart.com
   - `mobile`: 9999999999
   - `password_hash`: [paste the hash]
   - `account_type`: admin
   - `status`: active
   - `email_verified`: true
   - `mobile_verified`: true

## 📁 Project Structure

```
Grocery-App/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── controllers/ # Business logic
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth & validation
│   │   └── utils/        # Utilities
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── uploads/          # File uploads
│   └── .env             # Backend config
├── frontend/            # Next.js App
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   └── lib/          # API client & store
│   └── .env.local       # Frontend config
├── run.sh               # Run script
├── init-db.sh           # Database setup
├── verify-setup.sh      # Verify installation
└── package.json         # Root package.json
```

## 🔍 Verify Setup

Run the verification script:
```bash
./verify-setup.sh
```

This checks:
- ✅ Node.js and npm
- ✅ Dependencies installed
- ✅ Configuration files
- ✅ Directories created
- ✅ Prisma setup

## 🐛 Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Solutions:**
1. Start PostgreSQL:
   ```bash
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. Check `backend/.env` DATABASE_URL
3. Verify database exists: `psql -l | grep instamart_db`

### Port Already in Use

**Error:** `Port 3000 or 3001 already in use`

**Solution:**
```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

### Prisma Client Not Generated

**Solution:**
```bash
cd backend
npx prisma generate
```

### Module Not Found

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

## 📚 Documentation

- **RUN_INSTRUCTIONS.md** - Detailed run instructions
- **QUICK_START.md** - Quick start guide
- **SETUP.md** - Complete setup guide
- **backend/README.md** - API documentation
- **PROJECT_SUMMARY.md** - Feature overview

## 🎉 You're Ready!

1. ✅ Dependencies installed
2. ✅ Configuration files created
3. ✅ Scripts ready to use

**Next Step:** Run `./init-db.sh` to set up the database, then `./run.sh` to start!

## 💡 Tips

- Use `./verify-setup.sh` to check your setup
- Use `npx prisma studio` to view/edit database
- Check `backend/README.md` for API documentation
- All API endpoints are documented in `backend/README.md`

---

**Need Help?** Check the documentation files or run `./verify-setup.sh` to diagnose issues.

