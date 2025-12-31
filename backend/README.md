# Instamart Backend API

Express.js + TypeScript backend for Instamart B2B & B2C Grocery Platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **File Upload**: Multer

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   └── index.ts         # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── uploads/             # File uploads directory
└── package.json
```

## API Documentation

### Authentication Endpoints

#### B2C Registration
```http
POST /api/v1/auth/register/b2c
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "password123",
  "account_type": "b2c"
}
```

#### B2B Registration
```http
POST /api/v1/auth/register/b2b
Content-Type: multipart/form-data

Fields:
- business_name: "ABC Restaurant"
- business_type: "Restaurant"
- gst_number: "29ABCDE1234F1Z5"
- pan_number: "ABCDE1234F"
- contact_person: JSON string
- business_address: JSON string
- email: "contact@restaurant.com"
- password: "password123"
- gst_certificate: File
- business_license: File
- pan_card: File
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "john@example.com",
  "password": "password123"
}
```

### Product Endpoints

#### List Products
```http
GET /api/v1/products?account_type=b2c&category_id=xxx
Authorization: Bearer <token>
```

#### Get Product
```http
GET /api/v1/products/:productId?account_type=b2c
Authorization: Bearer <token>
```

### Cart Endpoints

#### Get Cart
```http
GET /api/v1/cart
Authorization: Bearer <token>
```

#### Add to Cart (B2C)
```http
POST /api/v1/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": "uuid",
  "quantity": 5
}
```

#### Add to Cart (B2B)
```http
POST /api/v1/cart/b2b/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": "uuid",
  "quantity": 50
}
```

### Order Endpoints

#### Place B2C Order
```http
POST /api/v1/orders/b2c/place
Authorization: Bearer <token>
Content-Type: application/json

{
  "delivery_address": {
    "recipient_name": "John Doe",
    "mobile": "9876543210",
    "address_line1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "delivery_slot": "30min",
  "payment_method": "cod"
}
```

#### Place B2B Order
```http
POST /api/v1/orders/b2b/place
Authorization: Bearer <token>
Content-Type: application/json

{
  "delivery_locations": [
    {
      "location_id": "loc1",
      "address": {...},
      "scheduled_date": "2025-01-15",
      "scheduled_time_slot": "morning"
    }
  ],
  "billing_address": {...},
  "scheduled_date": "2025-01-15",
  "payment_method": "credit",
  "po_number": "PO-2025-001"
}
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/instamart_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880
FRONTEND_URL="http://localhost:3000"
```

## Development

```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Database Management

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## Testing

API endpoints can be tested using:
- Postman
- curl
- Frontend application
- API testing tools

## Error Handling

All errors follow this format:
```json
{
  "status": "error",
  "message": "Error message",
  "errors": [] // Optional validation errors
}
```

Success responses:
```json
{
  "status": "success",
  "data": {} // Response data
}
```

## Security

- JWT authentication for protected routes
- Password hashing with bcrypt
- Input validation with express-validator
- File upload validation
- CORS configuration
- Environment variable protection

## License

MIT

