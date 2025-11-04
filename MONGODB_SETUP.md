# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended - Free)

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (free tier M0)
4. Create a database user:
   - Username: your_username
   - Password: your_secure_password
5. Add your IP to whitelist (or use 0.0.0.0/0 for development)
6. Get connection string from "Connect" button

### Update your .env.local file:

```env
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/eksu_clearance?retryWrites=true&w=majority

# JWT Secret (generate a secure one)
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

# Other required variables
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

## Option 2: Local MongoDB (Alternative)

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use local connection string:

```env
MONGODB_URI=mongodb://localhost:27017/eksu_clearance
```

## Option 3: Quick Test Database

Use this temporary connection string for testing:

```env
MONGODB_URI=mongodb+srv://testuser:testpass123@cluster0.xxxxx.mongodb.net/clearance_test?retryWrites=true&w=majority
```

## After Setting Up:

1. Create/update your `.env.local` file with the correct MONGODB_URI
2. Run: `npm run seed:steps`
3. Start the application: `npm run dev`

## Verify Connection:

Test your connection by running:
```bash
npx prisma db push
```

This will sync your schema with the database and verify the connection works.
