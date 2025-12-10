# Quick Start Guide - EnergyFlow Frontend

## 🚀 Start the Application

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:3001`

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:5173`

## 🔐 Login

Open `http://localhost:5173` in your browser.

**Demo Credentials:**
- Email: `john.smith@example.com`
- Password: `password123`

## 📍 Navigation

After login, you'll see the dashboard with:

1. **Dashboard** - Overview of homes, devices, consumption
2. **Homes** - Manage your homes
3. **Devices** - View and control devices
4. **Alerts** - Monitor alerts and notifications
5. **Reports** - Generate energy reports

## 🎯 Key Features

### View Your Data
- Dashboard shows summary statistics
- Click any home/device to view details
- Recent alerts appear on dashboard

### Authentication
- Login/logout from sidebar
- Protected routes automatically redirect
- Session persists in localStorage

### API Integration
- All pages fetch real data from backend
- Automatic loading states
- Error handling with toast notifications

## 🛠️ Development Tips

### Hot Reload
- Frontend: Changes auto-reload
- Backend: Nodemon auto-restarts

### Check API Responses
Open browser DevTools (F12) → Network tab to see API calls

### State Management
- Use React Query for server data
- Use Auth Context for user state

## 📝 Common Tasks

### Add a New Component
```bash
# Create component file
touch src/components/common/MyComponent.jsx
```

### Call API
```javascript
import { homeService } from '../services/homeService';
const homes = await homeService.getHomes();
```

### Show Toast Notification
```javascript
import toast from 'react-hot-toast';
toast.success('Success!');
toast.error('Error!');
```

## 🔍 Troubleshooting

### Can't login?
1. Make sure backend is running
2. Check backend has seeded data: `npm run seed`
3. Verify email/password

### API errors?
1. Check backend console for errors
2. Verify CORS is enabled
3. Check .env has correct API URL

### Page not loading?
1. Check browser console (F12)
2. Verify route exists in App.jsx
3. Check component imports

## 📚 Next Steps

1. Explore the code in `src/`
2. Review component examples
3. Check SETUP_COMPLETE.md for details
4. Start building your features!

Happy coding! 🎉
