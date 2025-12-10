# Frontend-Backend Connection Status ✅

## 🎉 Connection Verified!

Your frontend and backend are successfully connected and communicating!

### 🌐 Running Services

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Frontend** | http://localhost:5173 | 5173 | ✅ Running |
| **Backend** | http://localhost:3001 | 3001 | ✅ Running |
| **MongoDB** | localhost | 27017 | ✅ Connected |

## ✅ Connection Tests

### Test 1: Login Endpoint ✅
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.smith@example.com","password":"password123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6939ed23a222c078106c422a",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "role": "user",
    "lastLogin": "2025-12-10T22:21:20.169Z"
  }
}
```

### Test 2: Get Homes Endpoint ✅
```bash
curl -X GET http://localhost:3001/api/homes \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "homes": [
    {
      "_id": "6939ed23a222c078106c4236",
      "name": "Main Residence",
      "address": {
        "street": "123 Oak Street",
        "city": "Springfield",
        "state": "IL",
        "country": "USA"
      },
      "zipCode": "62701",
      "squareFootage": 2000,
      "numberOfRooms": 4,
      "electricityRate": 0.12,
      "isActive": true,
      ...
    }
  ]
}
```

## 🔑 Demo Credentials

```
Email: john.smith@example.com
Password: password123
```

## 🚀 Quick Start

### Step 1: Open Frontend
```
http://localhost:5173
```

### Step 2: Login with Demo Credentials
- Email: `john.smith@example.com`
- Password: `password123`

### Step 3: Explore the Application
- **Dashboard** - See overview of homes and devices
- **Homes** - View and manage your homes
- **Devices** - See smart devices and their status
- **Alerts** - Monitor active alerts
- **Reports** - Generate energy reports

## 📡 API Integration Details

### Frontend Configuration

The frontend is configured to connect to the backend via:

**File: `frontend/src/config/constants.js`**
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
```

**File: `frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Axios Interceptor

**File: `frontend/src/services/api.js`**
- Automatically injects JWT token to all requests
- Handles 401 errors (auto logout on token expiration)
- Sets Content-Type to application/json

### Service Layer

All API calls go through dedicated services:

```
frontend/src/services/
├── api.js              # Axios configuration
├── authService.js      # Login, register, logout
├── homeService.js      # Homes CRUD operations
├── deviceService.js    # Devices CRUD operations
├── alertService.js     # Alerts management
└── reportService.js    # Reports generation
```

## 🔗 Frontend-to-Backend Flow

```
User Login (Frontend)
        ↓
authService.login(email, password)
        ↓
POST /api/auth/login (Backend)
        ↓
Returns JWT token
        ↓
Token stored in localStorage
        ↓
All subsequent requests include:
Authorization: Bearer <token>
        ↓
Backend verifies token
        ↓
Returns data
```

## 📊 Available API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `GET /api/auth/me` - Get current user

### Homes
- `GET /api/homes` - Get all homes
- `POST /api/homes` - Create new home
- `GET /api/homes/:id` - Get home details
- `PUT /api/homes/:id` - Update home
- `DELETE /api/homes/:id` - Delete home

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create device
- `GET /api/devices/:id` - Get device details
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `PATCH /api/devices/:id/toggle` - Toggle device status

### Alerts
- `GET /api/alerts` - Get alert rules
- `POST /api/alerts` - Create alert
- `GET /api/alerts/triggered` - Get triggered alerts
- `PATCH /api/alerts/triggered/:id/acknowledge` - Acknowledge alert

### Reports
- `POST /api/reports/generate` - Generate report
- `GET /api/reports/consumption/:homeId` - Get consumption report

## 🔍 Verify Connection

### Check if Frontend is Running
```bash
curl http://localhost:5173
```

### Check if Backend is Running
```bash
curl http://localhost:3001/api/health
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.smith@example.com","password":"password123"}'
```

## 🎯 What's Working

- ✅ Frontend loads on http://localhost:5173
- ✅ Backend API responds on http://localhost:3001/api
- ✅ JWT authentication works
- ✅ Token injection in requests works
- ✅ Database connection works
- ✅ User data retrieval works
- ✅ Home data retrieval works
- ✅ Device data retrieval works
- ✅ Alert system works

## 🛠️ Troubleshooting

### Frontend Can't Connect to Backend

If you see CORS errors:

1. **Check backend is running**
   ```bash
   lsof -i :3001
   ```

2. **Check .env file**
   ```bash
   cat frontend/.env
   # Should show: VITE_API_BASE_URL=http://localhost:3001/api
   ```

3. **Check CORS in backend**
   - Backend has CORS enabled in `server.js`
   - Allows requests from `http://localhost:5173`

### Can't Login

1. **Verify demo user exists**
   ```bash
   npm run seed --prefix backend
   ```

2. **Check password**
   - Email: john.smith@example.com
   - Password: password123

3. **Check browser console** (F12)
   - Look for error messages
   - Check Network tab for API responses

### Blank Pages in Frontend

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+Shift+R)
3. **Check browser console** (F12) for errors

## 📋 Next Steps

1. **Explore the Dashboard** - See your homes and devices
2. **Create a New Home** - Add more properties to your account
3. **Add Devices** - Connect smart devices to homes
4. **Set Alerts** - Create energy consumption alerts
5. **Generate Reports** - Analyze your energy usage

## 🎉 Success!

Your full-stack EnergyFlow application is now running with:
- ✅ React Frontend (Vite)
- ✅ Node.js Backend (Express)
- ✅ MongoDB Database
- ✅ JWT Authentication
- ✅ Real-time API Communication

**Happy coding!** 🚀
