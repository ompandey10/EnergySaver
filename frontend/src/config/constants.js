export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user';

export const QUERY_KEYS = {
    USER: 'user',
    HOMES: 'homes',
    HOME_DETAIL: 'homeDetail',
    DEVICES: 'devices',
    DEVICE_DETAIL: 'deviceDetail',
    READINGS: 'readings',
    ALERTS: 'alerts',
    TRIGGERED_ALERTS: 'triggeredAlerts',
    REPORTS: 'reports',
    DEVICE_TEMPLATES: 'deviceTemplates',
};

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    HOMES: '/homes',
    HOME_DETAIL: '/homes/:id',
    DEVICES: '/devices',
    DEVICE_DETAIL: '/devices/:id',
    ALERTS: '/alerts',
    REPORTS: '/reports',
    PROFILE: '/profile',
};

export const DEVICE_CATEGORIES = {
    LIGHTING: 'Lighting',
    CLIMATE: 'Climate Control',
    APPLIANCES: 'Appliances',
    ENTERTAINMENT: 'Entertainment',
    SECURITY: 'Security',
    OTHER: 'Other',
};

export const ALERT_TYPES = {
    THRESHOLD: 'threshold',
    ANOMALY: 'anomaly',
    SCHEDULE: 'schedule',
};

export const ALERT_SEVERITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};
