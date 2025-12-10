# Testing Guide for CFA Backend

## Prerequisites

> **Note:** This backend uses port **3001** instead of 5000 because macOS AirPlay Receiver typically occupies port 5000. If you see "EADDRINUSE" errors, the port is already in use.

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod --dbpath /path/to/your/data
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

4. **Start the Server**
   ```bash
   npm run dev
   ```

---

## Testing Flow

### Step 1: Authentication Testing

#### 1.1 Register a New User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "_id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Save the token for subsequent requests!**

#### 1.2 Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### 1.3 Get Current User
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 2: Home Management Testing

#### 2.1 Create a Home
```bash
curl -X POST http://localhost:3001/api/homes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Home",
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62701"
    },
    "zipCode": "62701",
    "squareFootage": 2000,
    "numberOfRooms": 4,
    "homeType": "house",
    "electricityRate": 0.12
  }'
```

**Save the home ID from response!**

#### 2.2 Get All Homes
```bash
curl -X GET http://localhost:3001/api/homes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2.3 Get Home Statistics
```bash
curl -X GET http://localhost:3001/api/homes/HOME_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 3: Device Management Testing

#### 3.1 Get Device Templates
```bash
curl -X GET http://localhost:3001/api/devices/templates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3.2 Create Devices
```bash
# Create an HVAC device
curl -X POST http://localhost:3001/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "homeId": "HOME_ID",
    "name": "Living Room AC",
    "type": "hvac",
    "wattage": 3500,
    "brand": "Carrier",
    "location": "Living Room",
    "averageUsageHours": 8
  }'

# Create a Refrigerator
curl -X POST http://localhost:3001/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "homeId": "HOME_ID",
    "name": "Kitchen Fridge",
    "type": "refrigerator",
    "wattage": 150,
    "brand": "LG",
    "location": "Kitchen",
    "averageUsageHours": 24
  }'

# Create a Washing Machine
curl -X POST http://localhost:3001/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "homeId": "HOME_ID",
    "name": "Laundry Washer",
    "type": "washer_dryer",
    "wattage": 500,
    "brand": "Samsung",
    "location": "Laundry Room",
    "averageUsageHours": 2
  }'
```

**Save device IDs from responses!**

#### 3.3 Get Home Devices
```bash
curl -X GET http://localhost:3001/api/devices/home/HOME_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 4: Energy Reading Testing

#### 4.1 Simulate Readings for All Devices in Home
```bash
curl -X POST http://localhost:3001/api/readings/simulate/home/HOME_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "daysBack": 30,
    "intervalHours": 1
  }'
```

This will generate 30 days of hourly readings for all devices (720 readings per device).

#### 4.2 Get Device Readings
```bash
curl -X GET "http://localhost:3001/api/readings/device/DEVICE_ID?limit=50&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4.3 Get Home Readings (Aggregated)
```bash
# Daily aggregation
curl -X GET "http://localhost:3001/api/readings/home/HOME_ID?groupBy=day" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Hourly aggregation for last 7 days
curl -X GET "http://localhost:3001/api/readings/home/HOME_ID?groupBy=hour&startDate=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4.4 Get Real-time Consumption
```bash
curl -X GET http://localhost:3001/api/readings/realtime/HOME_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 5: Alert Management Testing

#### 5.1 Create a Usage Limit Alert
```bash
curl -X POST http://localhost:3001/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Usage Limit",
    "homeId": "HOME_ID",
    "type": "usage_limit",
    "limitKWh": 50,
    "period": "daily",
    "threshold": 80,
    "notificationMethods": ["email", "in_app"]
  }'
```

#### 5.2 Create a Cost Limit Alert
```bash
curl -X POST http://localhost:3001/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Cost Alert",
    "homeId": "HOME_ID",
    "type": "cost_limit",
    "costLimit": 150,
    "period": "monthly",
    "threshold": 90,
    "notificationMethods": ["email", "in_app"]
  }'
```

#### 5.3 Get User Alerts
```bash
curl -X GET http://localhost:3001/api/alerts/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5.4 Test Alert
```bash
curl -X POST http://localhost:3001/api/alerts/ALERT_ID/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5.5 Get Triggered Alerts
```bash
# Wait for the cron job to run (hourly) or manually trigger alert checker
curl -X GET "http://localhost:3001/api/alerts/triggered?isRead=false" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 6: Report Generation Testing

#### 6.1 Get Dashboard Summary
```bash
curl -X GET "http://localhost:3001/api/reports/dashboard?homeId=HOME_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 6.2 Get Cost Analysis
```bash
curl -X GET "http://localhost:3001/api/reports/cost-analysis?homeId=HOME_ID&analysisType=period" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 6.3 Get Savings Tips
```bash
curl -X GET "http://localhost:3001/api/reports/savings-tips?homeId=HOME_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 6.4 Get Neighborhood Comparison
```bash
# First, create a few more homes with same zip code to enable comparison
curl -X GET "http://localhost:3001/api/reports/comparison?homeId=HOME_ID&comparisonType=neighborhood" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 6.5 Generate Monthly PDF Report
```bash
curl -X GET "http://localhost:3001/api/reports/monthly?homeId=HOME_ID&month=1&year=2024" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --output monthly-report.pdf
```

---

### Step 7: Admin Testing (Optional)

First, update your user to admin role:
```bash
# Connect to MongoDB
mongo cfa_database

# Update user role
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { role: "admin" } }
)
```

#### 7.1 Get All Users
```bash
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 7.2 Get Community Insights
```bash
curl -X GET "http://localhost:3001/api/admin/insights" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 7.3 Get Platform Analytics
```bash
curl -X GET "http://localhost:3001/api/admin/analytics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 7.4 Create Device Template
```bash
curl -X POST http://localhost:3001/api/admin/devices/templates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Energy Efficient AC",
    "type": "hvac",
    "avgWattage": 2800,
    "minWattage": 2200,
    "maxWattage": 3500,
    "category": "heating_cooling",
    "description": "Energy star rated air conditioning unit"
  }'
```

---

## Using Postman

### Import Collection

1. Open Postman
2. Click "Import" button
3. Create a new collection called "CFA Energy API"
4. Create folders for each API group (Auth, Homes, Devices, etc.)

### Set Up Environment Variables

1. Create a new environment "CFA Local"
2. Add variables:
   - `base_url`: `http://localhost:3001/api`
   - `token`: (will be set after login)
   - `homeId`: (will be set after creating home)
   - `deviceId`: (will be set after creating device)
   - `alertId`: (will be set after creating alert)

### Create Requests

For each endpoint, create a request with:
- Method: GET/POST/PUT/DELETE
- URL: `{{base_url}}/auth/register`
- Headers: `Authorization: Bearer {{token}}`
- Body: JSON payload

### Test Script Example

Add to the "Tests" tab of your login request:
```javascript
// Save token for future requests
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    pm.environment.set("userId", jsonData.user._id);
}
```

---

## Verification Checklist

- [ ] User registration and login work
- [ ] JWT token is properly returned and validated
- [ ] Home creation and retrieval work
- [ ] Multiple devices can be added to a home
- [ ] Reading simulation generates data
- [ ] Historical readings can be retrieved
- [ ] Real-time consumption shows current usage
- [ ] Alerts can be created and configured
- [ ] Alert checker runs and triggers alerts
- [ ] Dashboard returns comprehensive data
- [ ] Cost analysis calculates correctly
- [ ] Savings tips are generated based on usage
- [ ] Neighborhood comparison works (with multiple homes)
- [ ] PDF report generates successfully
- [ ] Admin endpoints work with admin role
- [ ] Non-admin users cannot access admin endpoints
- [ ] Rate limiting works (test by making many requests)
- [ ] Error responses are consistent
- [ ] Soft deletes work (deleted items not returned)

---

## Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running on port 27017

### JWT Token Expired
```
401 Unauthorized: Token expired
```
**Solution:** Login again to get a fresh token

### Validation Errors
```
400 Bad Request: "email" must be a valid email
```
**Solution:** Check request body matches the schema

### Home Not Found
```
404 Not Found: Home not found
```
**Solution:** Verify the homeId is correct and belongs to your user

### Device Template Not Found
```
404 Not Found: No templates found
```
**Solution:** Use admin endpoint to create device templates first

### Insufficient Permissions
```
403 Forbidden: User role admin required
```
**Solution:** Update your user role to admin in the database

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test authentication endpoint
ab -n 100 -c 10 -p register.json -T application/json \
  http://localhost:3001/api/auth/register

# Test protected endpoint
ab -n 1000 -c 50 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/homes
```

### Expected Performance

- Authentication: < 200ms
- CRUD operations: < 100ms
- Reading queries: < 500ms (with 100k records)
- Dashboard summary: < 1s
- PDF generation: < 3s
- Neighborhood comparison: < 2s

---

## Next Steps

1. **Set up automated tests** with Jest/Mocha
2. **Create Postman collection** for easy API testing
3. **Add integration tests** for complex workflows
4. **Set up CI/CD pipeline** for automated testing
5. **Add API monitoring** with tools like New Relic or DataDog
6. **Implement WebSocket** for real-time notifications
7. **Add caching layer** with Redis for frequently accessed data
8. **Set up logging aggregation** with ELK stack or similar

---

## Support

If you encounter issues:
1. Check the server logs
2. Verify environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check the API documentation for correct request format
5. Review the error response for specific validation issues
