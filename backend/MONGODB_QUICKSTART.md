# MongoDB Quick Start

## ✅ What's Been Set Up

### 1. Database Configuration
- ✅ `.env` configured for MongoDB Compass (local)
- ✅ MongoDB Atlas connection string template included
- ✅ Connection: `mongodb://localhost:27017/cfa_database`

### 2. Database Collections

All 7 collections are automatically created:

| Collection | Documents | Description |
|------------|-----------|-------------|
| **users** | 6 | 5 regular users + 1 admin |
| **homes** | 5 | Properties with different locations |
| **devices** | 51 | Appliances across all homes |
| **readings** | 36,720+ | 30 days of hourly energy data |
| **alerts** | 15 | Usage and cost monitoring rules |
| **triggeredalerts** | 3 | Fired alert notifications |
| **devicetemplates** | 17 | Reference device configurations |

### 3. Sample Data Overview

#### Users (6 total)
```
Regular Users (password: password123):
├── john.smith@example.com
├── sarah.johnson@example.com
├── michael.brown@example.com
├── emily.davis@example.com
└── david.wilson@example.com

Admin User (password: admin123):
└── admin@cfa.com
```

#### Homes (5 properties)
1. **Main Residence** - Springfield, IL (62701) - 2000 sq ft house
2. **Downtown Apartment** - Chicago, IL (60601) - 1200 sq ft apartment  
3. **Suburban Home** - Naperville, IL (60540) - 2500 sq ft house
4. **Beach Condo** - Miami, FL (33139) - 1500 sq ft condo
5. **Mountain Townhouse** - Denver, CO (80202) - 1800 sq ft townhouse

#### Devices (51 total across all homes)
- **HVAC**: Central AC, window units, heat pumps, space heaters
- **Kitchen**: Refrigerators, ovens, microwaves, dishwashers
- **Laundry**: Washing machines, dryers
- **Entertainment**: TVs, computers, gaming consoles
- **Utilities**: Water heaters, lighting, pool pumps, EV chargers

#### Energy Readings (36,720 data points)
- **Coverage**: 30 days of historical data
- **Frequency**: Hourly readings for each device
- **Patterns**: Realistic usage based on device type
  - Refrigerators: 24/7 operation
  - HVAC: Peak during 10am-6pm
  - Lighting: Evening usage 6pm-11pm
  - Appliances: Sporadic usage spikes

---

## 🚀 Quick Commands

### Check MongoDB Connection
```bash
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✓ Connected:', mongoose.connection.host); process.exit(0); });"
```

### Seed Database
```bash
# Clear and reseed (recommended)
node seedDatabase.js --clear

# Append data (keeps existing)
node seedDatabase.js
```

### Start Backend Server
```bash
npm run dev
```

### Test API
```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.smith@example.com","password":"password123"}'
```

---

## 📊 View Data in MongoDB Compass

### Connect to Database
1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017`
3. Click "Connect"
4. Select `cfa_database`

### Useful Queries

#### View all users
```javascript
// In users collection
{}
```

#### Count devices by type
```javascript
// In devices collection > Aggregations
[
  { $group: { _id: "$type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]
```

#### Total energy consumption by home
```javascript
// In readings collection > Aggregations
[
  {
    $group: {
      _id: "$home",
      totalKWh: { $sum: "$kWh" },
      totalCost: { $sum: "$cost" },
      readingCount: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "homes",
      localField: "_id",
      foreignField: "_id",
      as: "homeInfo"
    }
  },
  { $sort: { totalKWh: -1 } }
]
```

#### Most recent readings per device
```javascript
// In readings collection
{}
// Sort: { timestamp: -1 }
// Limit: 10
```

---

## 🔗 Database Relationships

```
User (1) ──→ (Many) Homes
  │
  ├─→ Home (1) ──→ (Many) Devices
  │     │
  │     └─→ Device (1) ──→ (Many) Readings
  │
  └─→ User (1) ──→ (Many) Alerts
        │
        └─→ Alert (1) ──→ (Many) TriggeredAlerts
```

---

## 📝 Important Indexes

Automatically created for performance:

- `users.email` (unique)
- `homes.user + isActive`
- `homes.zipCode`
- `devices.home + isActive`
- `devices.type`
- `readings.device + timestamp`
- `readings.home + timestamp`
- `alerts.user + isEnabled`
- `triggeredalerts.user + isRead + triggeredAt`

---

## 🧪 Testing with Seeded Data

### 1. Test Authentication
```bash
# Login as regular user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.smith@example.com","password":"password123"}'

# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cfa.com","password":"admin123"}'
```

### 2. Get User's Homes
```bash
# Save token first
TOKEN="your_token_here"

curl -X GET http://localhost:3001/api/homes \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Get Home's Devices
```bash
HOME_ID="your_home_id_here"

curl -X GET http://localhost:3001/api/devices/home/$HOME_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get Energy Readings
```bash
DEVICE_ID="your_device_id_here"

curl -X GET "http://localhost:3001/api/readings/device/$DEVICE_ID?limit=24" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Get Dashboard
```bash
curl -X GET "http://localhost:3001/api/reports/dashboard?homeId=$HOME_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Database Management

### Clear All Data
```bash
node seedDatabase.js --clear
```

### Backup Database
```bash
mongodump --db=cfa_database --out=./backup/$(date +%Y%m%d)
```

### Restore Database
```bash
mongorestore --db=cfa_database ./backup/20241211/cfa_database
```

### Drop Database
```javascript
// In MongoDB Compass or mongo shell
use cfa_database
db.dropDatabase()
```

---

## 📚 Documentation Files

1. **MONGODB_SETUP_GUIDE.md** - Complete setup instructions for Compass & Atlas
2. **API_DOCUMENTATION.md** - All API endpoints reference
3. **TESTING_GUIDE.md** - Step-by-step API testing guide
4. **PORT_CONFIGURATION.md** - Port 3001 configuration details

---

## ✅ Verification Checklist

- [x] MongoDB running locally
- [x] Database connection successful
- [x] All 7 collections created
- [x] 36,720+ readings seeded
- [x] 6 users created (5 regular + 1 admin)
- [x] 5 homes with realistic data
- [x] 51 devices across homes
- [x] 17 device templates
- [x] 15 alerts configured
- [x] Indexes created automatically
- [x] Backend server running on port 3001
- [x] API endpoints tested successfully

---

## 🎯 Next Steps

1. **Open MongoDB Compass** to visualize the data
2. **Test API endpoints** using the seeded credentials
3. **Try the dashboard endpoint** to see aggregated data
4. **Generate PDF reports** with realistic energy data
5. **Test alert system** with existing triggered alerts

**Everything is ready to go!** 🚀
