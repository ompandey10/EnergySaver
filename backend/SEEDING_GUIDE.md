# Database Seeding Guide

## Quick Commands

### Clear and Reseed (Recommended for fresh start)
```bash
npm run seed:clear
```
This will:
1. ✅ Delete all existing data
2. ✅ Create fresh sample data
3. ✅ Generate 36,720+ energy readings

**Use this when:**
- Setting up the database for the first time
- You want to reset to clean sample data
- Testing from scratch

### Seed Without Clearing (Safe mode)
```bash
npm run seed
```
This will:
1. ⚠️ Check if data already exists
2. ⚠️ Skip device templates if they exist
3. ❌ Stop if users already exist (to prevent duplicates)

**Use this when:**
- You want to preserve existing data
- You're unsure if the database has data

## Expected Output

### Successful Seed
```
✓ MongoDB Connected: localhost
✓ Database cleared
✓ Created 17 device templates
✓ Created 6 users
✓ Created 5 homes
✓ Created 51 devices across 5 homes
✓ Created 36720 energy readings over 30 days
✓ Created 15 alerts
✓ Created 3 triggered alerts

✅ Database Seeding Complete!
```

### When Data Already Exists
```
✓ MongoDB Connected: localhost
⚠️ Running seed without clearing. Use --clear or -c to clear database first.
ℹ Found 17 existing device templates, skipping...
⚠ Found 6 existing users. Run with --clear to reset data.
✗ Seeding failed: Users already exist. Use --clear flag to reset database.
```

**Solution:** Run `npm run seed:clear` instead.

## What Gets Seeded

| Data Type | Count | Description |
|-----------|-------|-------------|
| **Users** | 6 | 5 regular users + 1 admin |
| **Homes** | 5 | Different locations and types |
| **Devices** | 51 | Various appliances across homes |
| **Device Templates** | 17 | Reference configurations |
| **Alerts** | 15 | Usage monitoring rules |
| **Triggered Alerts** | 3 | Sample notifications |
| **Energy Readings** | 36,720+ | 30 days × 24 hours × 51 devices |

## Login Credentials

After seeding, you can login with:

**Regular Users:**
```
Email: john.smith@example.com
Password: password123
```

**Admin User:**
```
Email: admin@cfa.com
Password: admin123
```

## Troubleshooting

### Error: "E11000 duplicate key error"
**Problem:** Trying to seed when data already exists.
**Solution:** Run `npm run seed:clear` to reset the database.

### Error: "Users already exist"
**Problem:** Safety check preventing duplicate data.
**Solution:** Run `npm run seed:clear` to start fresh.

### Error: "MongoDB Connection Error"
**Problem:** MongoDB is not running.
**Solution:** Start MongoDB:
```bash
# macOS
brew services start mongodb-community@8.0

# Check status
brew services list | grep mongodb
```

### Error: "Cannot find module"
**Problem:** Dependencies not installed.
**Solution:** 
```bash
npm install
```

## Advanced Usage

### Seed with Custom Options

You can also run the seeder directly:

```bash
# Clear and seed
node seedDatabase.js --clear

# Or use short flag
node seedDatabase.js -c

# Seed without clearing
node seedDatabase.js
```

### Check Database Before Seeding

```bash
# Quick connection test
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✓ Connected'); process.exit(0); });"

# Count existing documents
mongosh cfa_database --eval "db.users.countDocuments()"
```

### Verify Seeded Data

```bash
# Count all collections
mongosh cfa_database --eval "
  print('Users:', db.users.countDocuments());
  print('Homes:', db.homes.countDocuments());
  print('Devices:', db.devices.countDocuments());
  print('Readings:', db.readings.countDocuments());
  print('Alerts:', db.alerts.countDocuments());
"
```

## Next Steps After Seeding

1. **Start the backend server:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john.smith@example.com","password":"password123"}'
   ```

3. **Open MongoDB Compass:**
   - Connection: `mongodb://localhost:27017`
   - Database: `cfa_database`
   - Explore the 7 collections

4. **Test API endpoints:**
   - See `TESTING_GUIDE.md` for comprehensive testing instructions
   - Use the seeded credentials to test all endpoints

## Summary

✅ **For first-time setup:** `npm run seed:clear`  
✅ **To reset data:** `npm run seed:clear`  
⚠️ **To check for existing data:** `npm run seed`  
❌ **Never run `npm run seed` twice** (use `seed:clear` instead)

Happy testing! 🚀
