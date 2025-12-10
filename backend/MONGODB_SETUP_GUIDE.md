# MongoDB Setup Guide

This guide covers both **MongoDB Compass** (local) and **MongoDB Atlas** (cloud) setup options.

---

## Option 1: MongoDB Compass (Local Development)

### Prerequisites
- MongoDB Community Server installed
- MongoDB Compass GUI installed

### Step 1: Install MongoDB Community Server

#### macOS (using Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@8.0

# Start MongoDB service
brew services start mongodb-community@8.0

# Verify MongoDB is running
brew services list | grep mongodb
```

#### Windows
1. Download MongoDB Community Server from [mongodb.com/download-center/community](https://www.mongodb.com/try/download/community)
2. Run the installer (choose "Complete" installation)
3. Install as a Windows Service
4. Verify installation:
   ```cmd
   mongod --version
   ```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 2: Install MongoDB Compass

Download from: [mongodb.com/products/compass](https://www.mongodb.com/try/download/compass)

### Step 3: Connect with MongoDB Compass

1. Open MongoDB Compass
2. Use the default connection string:
   ```
   mongodb://localhost:27017
   ```
3. Click "Connect"
4. You should see the connection established

### Step 4: Create Database

In MongoDB Compass:
1. Click "Create Database"
2. Database Name: `cfa_database`
3. Collection Name: `users` (first collection)
4. Click "Create Database"

### Step 5: Configure Backend `.env`

Your `.env` file should have:
```env
MONGODB_URI=mongodb://localhost:27017/cfa_database
```

✅ **You're ready!** The local MongoDB is set up.

---

## Option 2: MongoDB Atlas (Cloud Database)

### Step 1: Create MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create a Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. Select your preferred cloud provider and region:
   - AWS, Google Cloud, or Azure
   - Choose a region close to your location for better latency
4. Cluster Name: `CFA-Cluster` (or any name you prefer)
5. Click **"Create"**
6. Wait 3-5 minutes for cluster creation

### Step 3: Create Database User

1. On the Security Quickstart screen:
   - **Authentication Method:** Username and Password
   - **Username:** `cfaadmin` (or your choice)
   - **Password:** Generate a secure password or create your own
   - **⚠️ IMPORTANT:** Save this password! You'll need it for the connection string
2. Click **"Create User"**

### Step 4: Whitelist IP Addresses

1. On the Network Access screen:
   - Click **"Add IP Address"**
   - Option A: Click **"Allow Access from Anywhere"** (for development)
     - This adds `0.0.0.0/0` - allows all IPs
   - Option B: Click **"Add Current IP Address"** (more secure)
     - Only allows your current IP
2. Click **"Confirm"**

> **Note:** For production, only whitelist specific IP addresses of your servers.

### Step 5: Get Connection String

1. Click **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select:
   - **Driver:** Node.js
   - **Version:** 5.5 or later
5. Copy the connection string. It looks like:
   ```
   mongodb+srv://cfaadmin:<password>@cfa-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual database user password
7. Add the database name before the `?`:
   ```
   mongodb+srv://cfaadmin:YourPassword123@cfa-cluster.xxxxx.mongodb.net/cfa_database?retryWrites=true&w=majority
   ```

### Step 6: Configure Backend `.env`

Update your `.env` file:
```env
# Comment out local MongoDB
# MONGODB_URI=mongodb://localhost:27017/cfa_database

# Use MongoDB Atlas
MONGODB_URI=mongodb+srv://cfaadmin:YourPassword123@cfa-cluster.xxxxx.mongodb.net/cfa_database?retryWrites=true&w=majority
```

### Step 7: Connect with MongoDB Compass (to Atlas)

1. Open MongoDB Compass
2. Paste your Atlas connection string:
   ```
   mongodb+srv://cfaadmin:YourPassword123@cfa-cluster.xxxxx.mongodb.net/
   ```
3. Click "Connect"
4. You'll see your `cfa_database` and collections

✅ **Atlas setup complete!**

---

## Database Schema & Collections

After connection, the following collections will be created automatically when you seed the database:

### Collections Created:

1. **users** - User accounts (regular and admin)
2. **homes** - User homes/properties
3. **devices** - Energy-consuming devices
4. **readings** - Energy consumption readings
5. **alerts** - User-defined alert rules
6. **triggeredalerts** - Fired alert notifications
7. **devicetemplates** - Pre-defined device types (admin)

---

## Seeding the Database

### Run the Seeder Script

```bash
# Navigate to backend directory
cd backend

# Run seeder (clears existing data)
node seedDatabase.js --clear

# Or run without clearing (appends data)
node seedDatabase.js
```

### What Gets Seeded:

✅ **6 Users** (5 regular + 1 admin)
- Regular users: `john.smith@example.com`, `sarah.johnson@example.com`, etc.
- Admin user: `admin@cfa.com`
- All passwords: `password123` (regular) / `admin123` (admin)

✅ **5 Homes** with different:
- Locations (Springfield IL, Chicago IL, Miami FL, Denver CO, etc.)
- Home types (house, apartment, condo, townhouse)
- Electricity rates (0.10 - 0.15 $/kWh)
- Square footage (1200 - 2500 sq ft)

✅ **50+ Devices** across all homes:
- HVAC systems, refrigerators, washers, dryers
- TVs, computers, gaming consoles
- Lighting, water heaters, EV chargers
- Pool pumps, dishwashers, microwaves

✅ **~36,000 Energy Readings** (30 days × 24 hours per device):
- Realistic usage patterns by device type
- HVAC: Peak during day (10am-6pm)
- Lighting: Evening usage (6pm-11pm)
- Appliances: Sporadic spikes during day
- Refrigerators: 24/7 with duty cycles

✅ **15-20 Alerts** across users:
- Daily usage limits
- Monthly cost limits
- Device-specific alerts (HVAC, etc.)

✅ **17 Device Templates** (admin reference data):
- Standard appliance configurations
- Average wattages and usage hours
- Energy efficiency information

### Expected Output:

```
✓ MongoDB Connected: localhost
✓ Database cleared

📋 Seeding Device Templates...
✓ Created 17 device templates

👥 Seeding Users...
✓ Created 6 users

🏠 Seeding Homes...
✓ Created 5 homes

⚡ Seeding Devices...
✓ Created 52 devices across 5 homes

📊 Seeding Energy Readings...
ℹ Inserted 1000 readings...
ℹ Inserted 2000 readings...
...
✓ Created 37440 energy readings over 30 days

🔔 Seeding Alerts...
✓ Created 15 alerts

✅ Database Seeding Complete!

📝 Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Regular Users:
  john.smith@example.com / password123
  sarah.johnson@example.com / password123
  michael.brown@example.com / password123
  emily.davis@example.com / password123
  david.wilson@example.com / password123

Admin User:
  admin@cfa.com / admin123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Verify Database in MongoDB Compass

### View Collections

1. Open MongoDB Compass
2. Connect to your database
3. Expand `cfa_database`
4. You should see all 7 collections

### Sample Queries to Test

#### Get all users
```javascript
// In Compass > users collection > Documents tab
{}
```

#### Get homes with devices count
```javascript
// In Compass > homes collection
// Use Aggregation tab:
[
  {
    $lookup: {
      from: "devices",
      localField: "_id",
      foreignField: "home",
      as: "devices"
    }
  },
  {
    $project: {
      name: 1,
      address: 1,
      deviceCount: { $size: "$devices" }
    }
  }
]
```

#### Get total energy consumption by home
```javascript
// In Compass > readings collection > Aggregations tab:
[
  {
    $group: {
      _id: "$home",
      totalKWh: { $sum: "$kWh" },
      totalCost: { $sum: "$cost" }
    }
  },
  {
    $sort: { totalKWh: -1 }
  }
]
```

---

## Testing Database Connection

### Test from Backend

```bash
# Start the backend server
npm run dev

# You should see:
# ✓ MongoDB Connected: localhost (or your Atlas host)
# ✓ Server running in development mode on port 3001
```

### Test API Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-12-11T00:00:00.000Z",
  "environment": "development"
}
```

### Test User Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@example.com",
    "password": "password123"
  }'
```

---

## Database Indexes

The following indexes are automatically created for optimal query performance:

### Users Collection
- `email` (unique)
- `role`

### Homes Collection
- `user + isActive` (compound)
- `zipCode`

### Devices Collection
- `home + isActive` (compound)
- `type`

### Readings Collection
- `device + timestamp` (compound)
- `home + timestamp` (compound)
- `timestamp`

### Alerts Collection
- `user + isEnabled` (compound)
- `home`
- `device`

### TriggeredAlerts Collection
- `user + isRead` (compound)
- `triggeredAt`

### DeviceTemplates Collection
- `type + isActive` (compound)

---

## Troubleshooting

### Issue: "MongooseServerSelectionError: connect ECONNREFUSED"

**Solution for Local MongoDB:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community@8.0
```

**Solution for Atlas:**
- Verify your connection string is correct
- Check that your IP is whitelisted in Atlas Network Access
- Ensure your password doesn't contain special characters (URL encode if needed)

### Issue: "Authentication failed"

**For Local MongoDB:**
- Local MongoDB typically doesn't require authentication by default
- Use: `mongodb://localhost:27017/cfa_database`

**For Atlas:**
- Verify username and password in connection string
- Check that the database user exists in Atlas
- Ensure password is correctly URL-encoded

### Issue: "Database not appearing in Compass"

- The database is created automatically when you insert the first document
- Run the seeder script: `node seedDatabase.js --clear`
- Refresh the connection in Compass

### Issue: Seeder script fails

```bash
# Check MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cfa_database').then(() => console.log('✓ Connected')).catch(err => console.log('✗ Error:', err.message));"

# Ensure all dependencies are installed
npm install

# Run with verbose error output
NODE_ENV=development node seedDatabase.js --clear
```

---

## Database Backup & Restore

### Backup Database (mongodump)

```bash
# Backup local MongoDB
mongodump --db=cfa_database --out=./backup

# Backup Atlas (requires connection string)
mongodump --uri="mongodb+srv://cfaadmin:password@cluster.mongodb.net/cfa_database" --out=./backup
```

### Restore Database (mongorestore)

```bash
# Restore to local MongoDB
mongorestore --db=cfa_database ./backup/cfa_database

# Restore to Atlas
mongorestore --uri="mongodb+srv://cfaadmin:password@cluster.mongodb.net/cfa_database" ./backup/cfa_database
```

---

## Production Recommendations

### Security Best Practices

1. **Use Atlas for Production**
   - Automatic backups
   - Built-in security features
   - Better performance and scaling

2. **Secure Connection Strings**
   - Never commit `.env` file to Git
   - Use environment variables on your hosting platform
   - Rotate database passwords regularly

3. **Network Access**
   - Whitelist only production server IPs
   - Never use `0.0.0.0/0` in production

4. **Database Users**
   - Create separate users for different environments
   - Use principle of least privilege
   - Enable database-level permissions

5. **Enable Authentication**
   ```javascript
   // For local MongoDB in production
   MONGODB_URI=mongodb://username:password@localhost:27017/cfa_database?authSource=admin
   ```

### Monitoring

- Use **MongoDB Atlas Monitoring** for cloud deployments
- Set up **alerts** for connection failures, high CPU, disk usage
- Enable **Performance Advisor** in Atlas for query optimization

---

## Quick Reference

| Task | Command |
|------|---------|
| Start local MongoDB (macOS) | `brew services start mongodb-community@8.0` |
| Stop local MongoDB (macOS) | `brew services stop mongodb-community@8.0` |
| Seed database | `node seedDatabase.js --clear` |
| Connect with Compass | `mongodb://localhost:27017` |
| Start backend | `npm run dev` |
| Test API | `curl http://localhost:3001/api/health` |

---

## Next Steps

✅ MongoDB connected  
✅ Database seeded with sample data  
✅ Collections and indexes created  
✅ Ready to test API endpoints!  

📚 See `TESTING_GUIDE.md` for API testing instructions.
