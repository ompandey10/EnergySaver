# CFA Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## A. Authentication APIs

### Register User
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** JWT token + user object

### Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** JWT token + user object

### Logout
- **Endpoint:** `POST /api/auth/logout`
- **Access:** Private
- **Response:** Success message

### Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Access:** Private
- **Response:** User profile

### Update Profile
- **Endpoint:** `PUT /api/auth/profile`
- **Access:** Private
- **Body:**
  ```json
  {
    "name": "John Updated",
    "email": "john.new@example.com"
  }
  ```

### Update Password
- **Endpoint:** `PUT /api/auth/password`
- **Access:** Private
- **Body:**
  ```json
  {
    "currentPassword": "oldpass",
    "newPassword": "newpass"
  }
  ```

---

## B. Home Management APIs

### Create Home
- **Endpoint:** `POST /api/homes`
- **Access:** Private
- **Body:**
  ```json
  {
    "name": "My Home",
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL"
    },
    "zipCode": "62701",
    "squareFootage": 2000,
    "numberOfRooms": 4,
    "homeType": "house",
    "electricityRate": 0.12
  }
  ```

### Get All Homes
- **Endpoint:** `GET /api/homes`
- **Access:** Private
- **Response:** Array of user's homes

### Get Single Home
- **Endpoint:** `GET /api/homes/:id`
- **Access:** Private
- **Response:** Home details with device count

### Update Home
- **Endpoint:** `PUT /api/homes/:id`
- **Access:** Private
- **Body:** Same as create (partial updates allowed)

### Delete Home
- **Endpoint:** `DELETE /api/homes/:id`
- **Access:** Private
- **Response:** Success message (soft delete)

### Get Home Statistics
- **Endpoint:** `GET /api/homes/:id/stats`
- **Access:** Private
- **Response:** Device count, total wattage, 30-day usage stats

---

## C. Device Management APIs

### Create Device
- **Endpoint:** `POST /api/devices`
- **Access:** Private
- **Body:**
  ```json
  {
    "homeId": "60d5ec49f1b2c72b8c8e4a1a",
    "name": "Living Room AC",
    "type": "hvac",
    "wattage": 3500,
    "brand": "Carrier",
    "model": "XYZ-2000",
    "location": "Living Room",
    "isSmartDevice": false,
    "averageUsageHours": 8
  }
  ```

### Get Home Devices
- **Endpoint:** `GET /api/devices/home/:homeId`
- **Access:** Private
- **Response:** Array of devices for the home

### Get Single Device
- **Endpoint:** `GET /api/devices/:id`
- **Access:** Private
- **Response:** Device details with recent readings

### Update Device
- **Endpoint:** `PUT /api/devices/:id`
- **Access:** Private
- **Body:** Same as create (partial updates allowed)

### Delete Device
- **Endpoint:** `DELETE /api/devices/:id`
- **Access:** Private
- **Response:** Success message (soft delete)

### Get Device Templates
- **Endpoint:** `GET /api/devices/templates`
- **Access:** Private
- **Response:** Array of predefined device types

### Get Device Statistics
- **Endpoint:** `GET /api/devices/:id/stats`
- **Access:** Private
- **Response:** Usage stats for today, this week, this month

---

## D. Energy Reading APIs

### Get Device Readings
- **Endpoint:** `GET /api/readings/device/:deviceId`
- **Access:** Private
- **Query Params:**
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
  - `limit` (optional): Number (default: 100)
  - `page` (optional): Number (default: 1)
- **Response:** Paginated readings with summary

### Get Home Readings
- **Endpoint:** `GET /api/readings/home/:homeId`
- **Access:** Private
- **Query Params:**
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
  - `groupBy` (optional): 'hour', 'day', 'month' (default: 'day')
- **Response:** Aggregated readings

### Simulate Device Readings
- **Endpoint:** `POST /api/readings/simulate`
- **Access:** Private
- **Body:**
  ```json
  {
    "deviceId": "60d5ec49f1b2c72b8c8e4a1a",
    "daysBack": 30,
    "intervalHours": 1
  }
  ```
- **Response:** Summary of generated readings

### Simulate Home Readings
- **Endpoint:** `POST /api/readings/simulate/home/:homeId`
- **Access:** Private
- **Body:**
  ```json
  {
    "daysBack": 30,
    "intervalHours": 1
  }
  ```
- **Response:** Summary for all devices

### Get Real-time Consumption
- **Endpoint:** `GET /api/readings/realtime/:homeId`
- **Access:** Private
- **Response:** Current consumption for all devices

---

## E. Alert Management APIs

### Create Alert
- **Endpoint:** `POST /api/alerts`
- **Access:** Private
- **Body:**
  ```json
  {
    "name": "High Usage Alert",
    "homeId": "60d5ec49f1b2c72b8c8e4a1a",
    "type": "usage_limit",
    "limitKWh": 50,
    "period": "daily",
    "threshold": 80,
    "notificationMethods": ["email", "in_app"]
  }
  ```

### Get User Alerts
- **Endpoint:** `GET /api/alerts/user`
- **Access:** Private
- **Query Params:**
  - `isEnabled` (optional): boolean
  - `type` (optional): alert type
- **Response:** Array of user's alerts

### Get Single Alert
- **Endpoint:** `GET /api/alerts/:id`
- **Access:** Private
- **Response:** Alert details

### Update Alert
- **Endpoint:** `PUT /api/alerts/:id`
- **Access:** Private
- **Body:** Same as create (partial updates allowed)

### Delete Alert
- **Endpoint:** `DELETE /api/alerts/:id`
- **Access:** Private
- **Response:** Success message

### Test Alert
- **Endpoint:** `POST /api/alerts/:id/test`
- **Access:** Private
- **Response:** Whether alert would trigger with current data

### Get Triggered Alerts
- **Endpoint:** `GET /api/alerts/triggered`
- **Access:** Private
- **Query Params:**
  - `isRead` (optional): boolean
  - `isResolved` (optional): boolean
  - `limit` (optional): Number
  - `page` (optional): Number
- **Response:** Paginated triggered alerts

### Mark Alert as Read
- **Endpoint:** `PUT /api/alerts/triggered/:id/read`
- **Access:** Private
- **Response:** Updated triggered alert

### Mark Alert as Resolved
- **Endpoint:** `PUT /api/alerts/triggered/:id/resolve`
- **Access:** Private
- **Response:** Updated triggered alert

---

## F. Report Generation APIs

### Generate Monthly Report PDF
- **Endpoint:** `GET /api/reports/monthly`
- **Access:** Private
- **Query Params:**
  - `homeId`: Home ID (required)
  - `month`: Month number 1-12 (required)
  - `year`: Year (required)
- **Response:** PDF file download

### Get Neighborhood Comparison
- **Endpoint:** `GET /api/reports/comparison`
- **Access:** Private
- **Query Params:**
  - `homeId`: Home ID (required)
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
  - `comparisonType` (optional): 'neighborhood', 'size', 'type'
- **Response:** Comparison data

### Get Savings Tips
- **Endpoint:** `GET /api/reports/savings-tips`
- **Access:** Private
- **Query Params:**
  - `homeId`: Home ID (required)
  - `category` (optional): Filter by category
  - `priority` (optional): 'high' for high priority only
- **Response:** Array of personalized tips

### Get Cost Analysis
- **Endpoint:** `GET /api/reports/cost-analysis`
- **Access:** Private
- **Query Params:**
  - `homeId`: Home ID (required)
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
  - `analysisType` (optional): 'period', 'monthly', 'projection', 'comparison'
- **Response:** Cost breakdown and analysis

### Get Dashboard Summary
- **Endpoint:** `GET /api/reports/dashboard`
- **Access:** Private
- **Query Params:**
  - `homeId`: Home ID (required)
- **Response:** Comprehensive dashboard data

---

## G. Admin APIs

All admin endpoints require admin role.

### Get All Users
- **Endpoint:** `GET /api/admin/users`
- **Access:** Private/Admin
- **Query Params:**
  - `page`, `limit`, `role`, `isActive`, `search`
- **Response:** Paginated user list with stats

### Get User by ID
- **Endpoint:** `GET /api/admin/users/:id`
- **Access:** Private/Admin
- **Response:** User details with homes and usage

### Update User
- **Endpoint:** `PUT /api/admin/users/:id`
- **Access:** Private/Admin
- **Body:**
  ```json
  {
    "name": "Updated Name",
    "email": "updated@email.com",
    "role": "admin",
    "isActive": true
  }
  ```

### Delete User
- **Endpoint:** `DELETE /api/admin/users/:id`
- **Access:** Private/Admin
- **Response:** Success message (soft delete)

### Create Device Template
- **Endpoint:** `POST /api/admin/devices/templates`
- **Access:** Private/Admin
- **Body:**
  ```json
  {
    "name": "Standard AC",
    "type": "hvac",
    "avgWattage": 3500,
    "minWattage": 2500,
    "maxWattage": 4500,
    "category": "heating_cooling",
    "description": "Standard air conditioning unit"
  }
  ```

### Update Device Template
- **Endpoint:** `PUT /api/admin/devices/templates/:id`
- **Access:** Private/Admin
- **Body:** Same as create

### Delete Device Template
- **Endpoint:** `DELETE /api/admin/devices/templates/:id`
- **Access:** Private/Admin
- **Response:** Success message (soft delete)

### Get Community Insights
- **Endpoint:** `GET /api/admin/insights`
- **Access:** Private/Admin
- **Query Params:**
  - `zipCode` (optional): Filter by zip code
- **Response:** Community-wide statistics

### Get Platform Analytics
- **Endpoint:** `GET /api/admin/analytics`
- **Access:** Private/Admin
- **Query Params:**
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
- **Response:** Platform-wide analytics and trends

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- **General API:** 100 requests per 15 minutes
- **Auth routes:** 10 requests per hour
- **Heavy operations (PDF generation):** 10 requests per minute

---

## Pagination

For paginated endpoints, the response includes:

```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": []
}
```

---

## Background Jobs

The system runs the following cron jobs:

1. **Alert Checker** - Runs every hour to check usage against alert limits
2. **Reading Simulator** - Can be triggered manually via API

---

## Notes

1. All dates should be in ISO 8601 format
2. MongoDB ObjectIds are validated automatically
3. Soft deletes are used (isActive flag)
4. JWT tokens expire after 7 days (configurable via JWT_EXPIRE env variable)
5. All monetary values are in USD
6. Energy consumption is measured in kWh
7. Power is measured in Watts
