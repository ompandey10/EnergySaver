# Frontend Quick Reference Guide

## Component Quick Start

### Using ConsumptionChart
```jsx
import ConsumptionChart from '../components/dashboard/ConsumptionChart';

// Example usage
<ConsumptionChart 
  data={chartData}
  isLoading={isLoading}
/>
```

**Props:**
- `data`: Array of consumption data with timestamp, total, and breakdown
- `isLoading`: Boolean for loading state

---

### Using DeviceStatusCards
```jsx
import DeviceStatusCards from '../components/dashboard/DeviceStatusCards';

// Example usage
<DeviceStatusCards 
  devices={devices}
  onEdit={(deviceId) => handleEdit(deviceId)}
  onDelete={(deviceId) => handleDelete(deviceId)}
  onToggle={(deviceId) => handleToggle(deviceId)}
/>
```

**Props:**
- `devices`: Array of device objects
- `onEdit`: Callback function for edit action
- `onDelete`: Callback function for delete action
- `onToggle`: Callback function for power toggle

---

### Using DevicesTable
```jsx
import DevicesTable from '../components/devices/DevicesTable';

// Example usage
<DevicesTable 
  devices={devices}
  onEdit={(deviceId) => openEditModal(deviceId)}
  onDelete={(deviceId) => deleteDevice(deviceId)}
  onView={(deviceId) => navigate(`/devices/${deviceId}`)}
/>
```

**Props:**
- `devices`: Array of device objects
- `onEdit`: Callback for edit action
- `onDelete`: Callback for delete action
- `onView`: Callback for view details action
- `isLoading`: Optional loading state

---

### Using AddDeviceModal
```jsx
import AddDeviceModal from '../components/devices/AddDeviceModal';
import { useState } from 'react';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add Device</button>
      <AddDeviceModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          setIsOpen(false);
          // Refetch devices
        }}
        homes={homes}
        deviceTemplates={templates}
      />
    </>
  );
};
```

**Props:**
- `isOpen`: Boolean to control modal visibility
- `onClose`: Callback when modal closes
- `onSuccess`: Callback on successful device creation
- `homes`: Array of available homes
- `deviceTemplates`: Array of device templates

---

### Using EditDeviceModal
```jsx
import EditDeviceModal from '../components/devices/EditDeviceModal';
import { useState } from 'react';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleEdit = (device) => {
    setSelectedDevice(device);
    setIsOpen(true);
  };

  return (
    <EditDeviceModal 
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSuccess={() => {
        setIsOpen(false);
        // Refetch devices
      }}
      device={selectedDevice}
    />
  );
};
```

**Props:**
- `isOpen`: Boolean to control modal visibility
- `onClose`: Callback when modal closes
- `onSuccess`: Callback on successful device update
- `device`: Device object to edit

---

### Using AlertsPanel
```jsx
import AlertsPanel from '../components/alerts/AlertsPanel';

// Example usage
<AlertsPanel 
  alerts={alerts}
  onMarkAsRead={(alertId) => markAsRead(alertId)}
  onDismiss={(alertId) => dismissAlert(alertId)}
  onViewAll={() => navigate('/alerts')}
/>
```

**Props:**
- `alerts`: Array of alert objects
- `onMarkAsRead`: Callback to mark alert as read
- `onDismiss`: Callback to dismiss alert
- `onViewAll`: Callback for "View All" button

---

## Common Data Structures

### Device Object
```javascript
{
  _id: "device123",
  name: "Living Room Light",
  location: "Living Room",
  category: "lighting", // lighting, heating, cooling, kitchen, entertainment, other
  wattage: 60,
  isActive: true,
  currentConsumption: 45,
  dailyConsumption: 0.18, // in kWh
  weeklyConsumption: 1.26,
  totalConsumption: 5.4,
  efficiency: 85,
  serialNumber: "SN123456"
}
```

### Consumption Data Object
```javascript
{
  timestamp: "2024-12-11T14:30:00",
  total: 1500, // in watts
  breakdown: {
    "device1": 300,
    "device2": 450,
    "device3": 750
  }
}
```

### Alert Object
```javascript
{
  _id: "alert123",
  name: "High Energy Usage",
  severity: "warning", // critical, warning, info
  message: "Energy consumption exceeded threshold",
  device: {
    _id: "device123",
    name: "AC Unit"
  },
  triggeredAt: "2024-12-11T15:45:00",
  acknowledged: false
}
```

### Home Object
```javascript
{
  _id: "home123",
  name: "Main House",
  city: "New York",
  state: "NY",
  devices: [], // array of device IDs or device objects
  totalConsumption: 15.5, // daily in kWh
  totalCost: 3.25
}
```

---

## API Integration Examples

### Fetch Devices with React Query
```jsx
import { useQuery } from '@tanstack/react-query';
import { deviceService } from '../services/deviceService';

const { data, isLoading, error } = useQuery({
  queryKey: ['devices'],
  queryFn: () => deviceService.getDevices(),
});

const devices = data?.data || [];
```

### Fetch Device Detail
```jsx
const { data, isLoading } = useQuery({
  queryKey: ['device', deviceId],
  queryFn: () => deviceService.getDeviceDetail(deviceId),
  enabled: !!deviceId,
});

const device = data?.data;
```

### Fetch Alerts
```jsx
const { data } = useQuery({
  queryKey: ['alerts'],
  queryFn: () => alertService.getTriggeredAlerts({ limit: 5 }),
});

const alerts = data?.data || [];
```

---

## Authentication

### Using AuthContext
```jsx
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, login, logout } = useAuth();

  return (
    <div>
      {user && <p>Welcome, {user.name}!</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### Protected Route Usage
```jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## Navigation Examples

### Navigate to Device Detail
```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(`/devices/${deviceId}`);
```

### Navigate with State
```jsx
navigate('/alerts', { state: { severity: 'critical' } });
```

---

## Form Validation

### Using React Hook Form with Zod
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

// In JSX
<input {...register('email')} />
{errors.email && <span>{errors.email.message}</span>}
```

---

## Notifications

### Using React Hot Toast
```jsx
import toast from 'react-hot-toast';

// Success
toast.success('Device added successfully!');

// Error
toast.error('Failed to add device');

// Custom
toast((t) => (
  <div>
    Custom notification content
    <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
  </div>
));
```

---

## Icons

### Using Lucide React
```jsx
import { Lightbulb, Bell, Settings, LogOut } from 'lucide-react';

// In JSX
<Lightbulb className="h-6 w-6 text-blue-600" />
```

**Common Icons Used:**
- Dashboard: `LayoutDashboard`
- Devices: `Lightbulb`
- Alerts: `AlertTriangle`, `Bell`
- Settings: `Settings`
- Logout: `LogOut`
- Edit: `Edit`
- Delete: `Trash2`
- Add: `Plus`
- Back: `ArrowLeft`
- Home: `Home`
- Reports: `FileText`
- Trending: `TrendingUp`

---

## Styling Classes

### Common Tailwind Classes
```
Text Sizes:
- text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl

Colors (Blue theme):
- bg-blue-50, bg-blue-100, bg-blue-500, bg-blue-600
- text-blue-600, text-blue-700

Status Colors:
- Success: green-500, green-600, green-100
- Warning: yellow-500, orange-500, yellow-100
- Error: red-500, red-600, red-100

Spacing:
- p-4 (padding 1rem)
- m-4 (margin 1rem)
- space-y-4 (vertical spacing)
- space-x-4 (horizontal spacing)

Layout:
- flex, grid
- grid-cols-1, grid-cols-2, grid-cols-3
- gap-4, gap-6
```

---

## Mobile Responsive Breakpoints

```
Mobile First:
- No prefix: < 640px
- sm: >= 640px
- md: >= 768px
- lg: >= 1024px
- xl: >= 1280px

Example:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## Error Handling

### Standard Error Response Format
```javascript
{
  success: false,
  message: "Error description",
  errors: [] // optional array of field errors
}
```

### Success Response Format
```javascript
{
  success: true,
  data: {}, // response data
  message: "Success message"
}
```

---

## Performance Tips

1. **Use React Query for data fetching**
   - Automatic caching
   - Background refetch
   - Request deduplication

2. **Lazy load pages**
   - Use React.lazy() for page components
   - Wrap with Suspense

3. **Memoize components**
   - Use React.memo() for components that render frequently
   - Use useMemo() for expensive computations

4. **Image optimization**
   - Use appropriate sizes
   - Consider lazy loading

5. **Chart optimization**
   - Limit data points shown
   - Use ResponsiveContainer from recharts

---

## Debugging

### Enable React Query DevTools
```jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In App.jsx
<QueryClientProvider client={queryClient}>
  {/* Your app */}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Console Logging
```jsx
// Device selection in modal
console.log('Selected template:', template);

// API calls
console.log('Auto-refreshing consumption data...');
```

---

## Environment Variables

Required in `.env` or `.env.local`:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

Access in code:
```jsx
import.meta.env.VITE_API_BASE_URL
```

---

## Common Issues & Solutions

### Issue: Modal not opening
**Solution:** Check that `isOpen` state is properly managed and passed to Modal component

### Issue: Chart not displaying
**Solution:** Ensure ResponsiveContainer parent has defined height, data is not empty

### Issue: Auto-refresh not working
**Solution:** Check that useEffect dependencies are correct, interval is being cleared

### Issue: Form validation not working
**Solution:** Verify Zod schema matches form fields, zodResolver is properly configured

### Issue: Navigation not working
**Solution:** Ensure routes are defined in App.jsx, useNavigate hook is used correctly

---

## File Naming Conventions

- **Components:** PascalCase (e.g., `DeviceStatusCards.jsx`)
- **Pages:** PascalCase (e.g., `Dashboard.jsx`)
- **Hooks:** camelCase with 'use' prefix (e.g., `useDevices.js`)
- **Utilities:** camelCase (e.g., `helpers.js`)
- **Services:** camelCase (e.g., `deviceService.js`)
- **Styles:** Tailwind classes in components

---

## Git Workflow

Before committing:
1. Test all new features
2. Check for console errors
3. Verify responsive design on mobile
4. Run ESLint if configured: `npm run lint`

---

Generated: December 2024
Version: 1.0
