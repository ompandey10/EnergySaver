# Frontend Pages & Components Implementation Guide

## Overview
This document outlines all the pages and components that have been created for the EnergyFlow Smart Energy Management System frontend.

---

## A. Authentication Pages

### 1. Login Page (`/login`)
**File:** `src/pages/Login.jsx`

**Features:**
- Email/password input fields
- Form validation using Zod schema
- Error message display
- "Remember me" checkbox with localStorage persistence
- Link to signup page
- Link to forgot password page

**Key Functionality:**
- Stores remembered email in localStorage when "Remember me" is checked
- Auto-fills email on return visit if previously remembered
- Integrates with AuthContext for authentication

---

### 2. Signup/Register Page (`/register`)
**File:** `src/pages/Register.jsx`

**Features:**
- First name and last name inputs
- Email input
- Password input with visual strength indicator
- Confirm password validation
- Terms & conditions checkbox with links
- Form validation

**Key Functionality:**
- Real-time password strength calculation with 5 levels (Weak to Very Strong)
- Visual checklist showing password requirements:
  - At least 8 characters
  - Lowercase & uppercase letters
  - Contains a number
  - Contains a symbol
- Terms checkbox validation before submission
- Auto-login after successful registration

---

### 3. Forgot Password Page (`/forgot-password`)
**File:** `src/pages/ForgotPassword.jsx`

**Features:**
- Email input for password recovery
- Success confirmation screen
- Option to try another email
- Back to login link

**Key Functionality:**
- Sends password recovery email to backend
- Shows confirmation message with submitted email
- 24-hour recovery link expiration notice
- Two-step UX: request → confirmation

---

## B. Main Dashboard (`/dashboard`)

### Components Used:
1. **DashboardLayout** - Main layout wrapper with Sidebar and Header
2. **ConsumptionChart** - Real-time energy consumption visualization
3. **DeviceStatusCards** - Grid of device status cards
4. **AlertsPanel** - Active alerts list
5. **StatCard** - Overview statistics cards

### Dashboard Features:
- Total homes count
- Active devices count
- Energy consumption (today/week/month)
- Total cost with trend analysis
- Real-time consumption chart with 24-hour view
- Toggle between home total and device breakdown
- Auto-refresh every 30 seconds
- Recent alerts panel (last 5 triggered alerts)
- Homes overview with usage statistics

---

## C. Layout Components

### 1. Header Component
**File:** `src/components/layout/Header.jsx`

**Features:**
- Page title display
- Search bar (hidden on mobile)
- Notifications bell with dropdown
- User profile dropdown menu

**Dropdown Contents:**
- User name and email
- "My Profile" link
- "Settings" link
- "Logout" button

**Notifications Features:**
- Badge showing alert count
- Sample notifications display
- "View all notifications" link

---

### 2. Sidebar Navigation
**File:** `src/components/layout/Sidebar.jsx`

**Menu Items:**
- Dashboard
- Homes
- Devices
- Alerts
- Reports
- Settings

**Admin Section (Conditional):**
- Device Templates
- Analytics

**Features:**
- Mobile hamburger menu
- Active route highlighting
- Collapsible admin section (for admin users)
- Mobile overlay
- Responsive design

---

## D. Real-time Consumption Chart
**File:** `src/components/dashboard/ConsumptionChart.jsx`

**Features:**
- Line chart showing last 24 hours of consumption
- Toggle between "Home Total" and "Device Breakdown" views
- Auto-refresh checkbox (30-second interval)
- Manual refresh button
- Statistics panel showing:
  - Current consumption
  - Average consumption
  - Peak consumption
- Responsive design with proper Y-axis labeling (Watts)

**Data Requirements:**
- `timestamp` - for X-axis
- `total` - total consumption
- `breakdown` - individual device data (for breakdown view)

---

## E. Device Status Cards
**File:** `src/components/dashboard/DeviceStatusCards.jsx`

**Features:**
- Grid layout (1 col mobile, 2 col tablet, 3 col desktop)
- Device icon (category-based emoji)
- Device name and location
- Status badge (On/Off)
- Current consumption in watts
- Today's consumption in kWh
- Weekly consumption display
- Efficiency percentage with progress bar
- Quick actions:
  - Power toggle
  - View details (navigate to DeviceDetail)
  - Edit device
  - Delete device

---

## F. Devices Management Page (`/devices`)

### Components:
1. **DevicesTable** - Advanced sortable/filterable table
2. **AddDeviceModal** - Modal for adding new devices
3. **EditDeviceModal** - Modal for editing devices

### DevicesTable Features
**File:** `src/components/devices/DevicesTable.jsx`

- Searchable by device name or location
- Filter by category dropdown
- Sortable columns (name, location, category, wattage)
- Display columns:
  - Device Name (with serial number)
  - Location
  - Category (color badge)
  - Wattage
  - Status badge
  - Today's Usage
  - Actions (View, Edit, Delete)
- Device count display at bottom
- Hover effects on rows

---

### Add Device Modal
**File:** `src/components/devices/AddDeviceModal.jsx`

**Features:**
- Home selection dropdown
- Quick select from device templates
- Auto-population of category and wattage from templates
- Manual device name input
- Location input
- Category dropdown
- Wattage input

**Form Fields:**
- Home (required)
- Device Name (required)
- Location (required)
- Category (required)
- Wattage (required)

---

### Edit Device Modal
**File:** `src/components/devices/EditDeviceModal.jsx`

**Features:**
- Pre-filled form with current device data
- Same fields as Add Device Modal (except Home selection)
- Auto-loads device data on modal open

**Form Fields:**
- Device Name
- Location
- Category
- Wattage

---

## G. Device Detail View (`/devices/:deviceId`)
**File:** `src/pages/DeviceDetail.jsx`

### Overview Cards:
1. Device basic info (name, location, status)
2. Category & wattage
3. Today's usage & active hours
4. Average daily cost

### Charts:
1. **Consumption History** (Line chart)
   - 7 or 30 day toggle
   - Shows daily kWh consumption

2. **Daily Usage Pattern** (Bar chart)
   - Hours active per day
   - Visual comparison across days

### Statistics Section:
1. **Efficiency Rating**
   - Percentage display (0-100%)
   - Efficiency tips

2. **Saving Tips**
   - Usage pattern insights
   - Potential monthly savings estimate

3. **Cost Analysis**
   - This week's cost
   - This month's cost
   - Yearly estimate

---

## H. Alerts Management

### Active Alerts Panel
**File:** `src/components/alerts/AlertsPanel.jsx`

**Features:**
- List of active alerts (max 5 shown)
- Unread alert count badge
- Alert severity badges (critical, warning, info)
- Alert icon color coding
- Device name and trigger timestamp
- Actions for each alert:
  - Mark as read
  - View details
  - Dismiss alert
- "View all" button for full alerts list

**Alert Information:**
- Alert name
- Severity level
- Associated device
- Trigger message
- Trigger timestamp
- Acknowledgment status

---

## I. Common Components Used Throughout

### Button (`src/components/common/Button.jsx`)
- Variants: primary, outline, ghost
- Sizes: sm, md, lg
- Loading state with spinner
- Disabled state

### Input (`src/components/common/Input.jsx`)
- Label support
- Icon support
- Error message display
- Placeholder text
- Type variants (text, email, password, number)

### Card (`src/components/common/Card.jsx`)
- Optional title and subtitle
- Consistent padding and styling
- Hover effects

### Badge (`src/components/common/Badge.jsx`)
- Variants: success, warning, destructive, default, secondary
- Size options

### Modal (`src/components/common/Modal.jsx`)
- Title and close button
- Backdrop overlay
- Responsive design

### Spinner (`src/components/common/Spinner.jsx`)
- Size variants (sm, md, lg)
- Loading indicator

---

## J. Routes Configuration

All routes are configured in `src/App.jsx`:

### Public Routes:
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password recovery
- `/` - Redirects to `/dashboard`

### Protected Routes:
- `/dashboard` - Main dashboard
- `/homes` - Homes management
- `/devices` - Devices list with table
- `/devices/:deviceId` - Device detail view
- `/alerts` - Alerts management
- `/reports` - Reports and analytics

---

## K. Key Features Summary

### Authentication:
✅ Remember me functionality with localStorage
✅ Password strength indicator
✅ Terms & conditions acceptance
✅ Password recovery flow

### Dashboard:
✅ Real-time consumption chart with auto-refresh
✅ Device status cards with quick actions
✅ Active alerts panel
✅ Overview statistics cards

### Devices Management:
✅ Advanced sortable/filterable table
✅ Add device modal with template support
✅ Edit device modal
✅ Device detail view with charts
✅ Efficiency rating and saving tips
✅ Cost analysis

### Navigation:
✅ Header with profile dropdown and notifications
✅ Sidebar with admin section (conditional)
✅ Mobile-responsive navigation

### Alerts:
✅ Active alerts panel
✅ Severity-based color coding
✅ Mark as read functionality
✅ Dismiss alerts

---

## L. Integration Points

### Services Used:
- `homeService` - Fetch homes data
- `deviceService` - Fetch devices, get device details
- `alertService` - Fetch triggered alerts

### Context Used:
- `AuthContext` - User authentication and logout

### External Libraries:
- `react-router-dom` - Routing and navigation
- `react-hook-form` - Form management
- `zod` - Schema validation
- `recharts` - Charts and visualizations
- `lucide-react` - Icons
- `react-hot-toast` - Notifications
- `@tanstack/react-query` - Data fetching and caching

---

## M. Next Steps / Future Enhancements

1. **Settings Page** - User preferences, notification settings, profile editing
2. **Profile Page** - View and edit user information
3. **Admin Pages** - Device templates management, analytics dashboard
4. **Homes Management** - Create, edit, delete homes
5. **Reports Page** - Monthly/yearly usage reports, cost analysis
6. **Alerts Full Page** - Comprehensive alerts management
7. **Real-time Updates** - WebSocket integration for live data
8. **Dark Mode** - Theme toggle
9. **Internationalization** - Multi-language support

---

## N. File Structure
```
frontend/src/
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   ├── Dashboard.jsx
│   ├── Devices.jsx
│   ├── DeviceDetail.jsx
│   ├── Homes.jsx
│   ├── Alerts.jsx
│   └── Reports.jsx
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   ├── dashboard/
│   │   ├── ConsumptionChart.jsx
│   │   └── DeviceStatusCards.jsx
│   ├── devices/
│   │   ├── DevicesTable.jsx
│   │   ├── AddDeviceModal.jsx
│   │   └── EditDeviceModal.jsx
│   ├── alerts/
│   │   └── AlertsPanel.jsx
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx
│   │   ├── Spinner.jsx
│   │   └── Alert.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── homeService.js
│   ├── deviceService.js
│   ├── alertService.js
│   └── reportService.js
├── utils/
│   ├── helpers.js
│   └── validations.js
├── App.jsx
└── main.jsx
```

---

## O. Component Usage Examples

### Using ConsumptionChart:
```jsx
<ConsumptionChart 
  data={consumptionData}
  isLoading={isLoading}
/>
```

### Using DeviceStatusCards:
```jsx
<DeviceStatusCards 
  devices={devices}
  onEdit={(id) => handleEdit(id)}
  onDelete={(id) => handleDelete(id)}
  onToggle={(id) => handleToggle(id)}
/>
```

### Using DevicesTable:
```jsx
<DevicesTable 
  devices={devices}
  onEdit={(id) => openEditModal(id)}
  onDelete={(id) => deleteDevice(id)}
  onView={(id) => navigate(`/devices/${id}`)}
/>
```

### Using AlertsPanel:
```jsx
<AlertsPanel 
  alerts={alerts}
  onMarkAsRead={(id) => markAsRead(id)}
  onDismiss={(id) => dismissAlert(id)}
  onViewAll={() => navigate('/alerts')}
/>
```

---

## P. Styling Notes

- **Color Scheme:**
  - Primary: Blue (#2563eb)
  - Success: Green (#10b981)
  - Warning: Yellow/Orange
  - Danger/Critical: Red (#ef4444)

- **Responsive Breakpoints:**
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

- **Tailwind CSS:** Used throughout for styling

---

Generated: December 2024
