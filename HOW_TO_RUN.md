# 🚀 How to Run the Application

## Step-by-Step Instructions

### Step 1: Set Up Database

You have **3 options** to set up the database:

#### Option A: Simple Script (Recommended - Non-Interactive)

```bash
./init-db-simple.sh
```

This uses default PostgreSQL credentials:
- Username: `postgres`
- Password: `postgres`
- Database: `instamart_db`

**To use different credentials:**
```bash
DB_USER=youruser DB_PASS=yourpass ./init-db-simple.sh
```

#### Option B: Interactive Script

```bash
./init-db.sh
```

This will prompt you for:
- PostgreSQL username
- PostgreSQL password
- Database name
- Host and port

#### Option C: Manual Setup

**1. Create the database:**
```bash
createdb instamart_db
```

Or using psql:
```bash
psql -U postgres
CREATE DATABASE instamart_db;
\q
```

**2. Update backend/.env:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/instamart_db?schema=public"
```
*(Replace `postgres:postgres` with your actual username:password)*

**3. Run migrations:**
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

---

### Step 2: Start the Application

#### Option A: Run Both Servers Together (Recommended)

```bash
./run.sh
```

Or:
```bash
npm run dev
```

This starts:
- **Backend** on http://localhost:3001
- **Frontend** on http://localhost:3000

#### Option B: Run Separately

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

---

## Complete Example

Here's the complete flow:

```bash
# 1. Set up database (choose one method)
./init-db-simple.sh
# OR
./init-db.sh
# OR (manual)
createdb instamart_db
cd backend
npx prisma migrate dev --name init
cd ..

# 2. Start the application
./run.sh
# OR
npm run dev
```

---

## Verify It's Working

### 1. Check Backend
Open http://localhost:3001/health in browser or:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","message":"Instamart API is running"}
```

### 2. Check Frontend
Open http://localhost:3000 in your browser

You should see the landing page with "Shop for Home" and "Business Account" options.

### 3. Test API
```bash
# Get categories
curl http://localhost:3001/api/v1/categories

# Get products (B2C)
curl "http://localhost:3001/api/v1/products?account_type=b2c"
```

---

## Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # macOS
   brew services list | grep postgresql
   brew services start postgresql
   
   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Verify database exists:**
   ```bash
   psql -l | grep instamart_db
   ```

3. **Check backend/.env:**
   ```bash
   cat backend/.env | grep DATABASE_URL
   ```
   Make sure the credentials are correct.

4. **Test connection manually:**
   ```bash
   psql -U postgres -d instamart_db -c "SELECT 1;"
   ```

### Port Already in Use

**Error:** `Port 3000 or 3001 already in use`

**Solution:**

Find and kill the process:
```bash
# Find process
lsof -i :3001
# or
lsof -i :3000

# Kill process (replace <PID> with actual process ID)
kill -9 <PID>
```

Or change ports in `.env` files.

### Prisma Migration Errors

**Error:** `Migration failed` or `Prisma Client not generated`

**Solutions:**

1. **Generate Prisma Client:**
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Reset and re-run migrations (WARNING: Deletes all data):**
   ```bash
   cd backend
   npx prisma migrate reset
   npx prisma migrate dev --name init
   ```

3. **Check database connection:**
   ```bash
   cd backend
   npx prisma db pull  # Test connection
   ```

### Module Not Found Errors

**Error:** `Cannot find module '@prisma/client'` or similar

**Solution:**
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
npx prisma generate
```

---

## Common Commands

### Database Commands
```bash
cd backend

# Open Prisma Studio (Database GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Generate Prisma Client
npx prisma generate

# View database schema
npx prisma db pull
```

### Development Commands
```bash
# Run both servers
npm run dev

# Run backend only
cd backend && npm run dev

# Run frontend only
cd frontend && npm run dev

# Build for production
npm run build
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Set up database | `./init-db-simple.sh` |
| Start application | `./run.sh` or `npm run dev` |
| Verify setup | `./verify-setup.sh` |
| View database | `cd backend && npx prisma studio` |
| Check backend | `curl http://localhost:3001/health` |
| Check frontend | Open http://localhost:3000 |

---

## Next Steps After Setup

1. ✅ Database set up
2. ✅ Application running
3. 📝 Create admin user (see START_HERE.md)
4. 🧪 Test API endpoints
5. 🎨 Build frontend UI components

---

## Need Help?

- **START_HERE.md** - Quick start guide
- **RUN_INSTRUCTIONS.md** - Detailed instructions
- **QUICK_START.md** - Setup guide
- **backend/README.md** - API documentation

Run `./verify-setup.sh` to check your installation!

