import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export const homeSchema = z.object({
    name: z.string().min(2, 'Home name must be at least 2 characters'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code'),
    squareFootage: z.number().min(1, 'Square footage must be greater than 0').optional(),
    bedrooms: z.number().min(0).optional(),
    bathrooms: z.number().min(0).optional(),
    electricityRate: z.number().min(0, 'Rate must be greater than 0').optional(),
});

export const deviceSchema = z.object({
    name: z.string().min(2, 'Device name must be at least 2 characters'),
    category: z.string().min(1, 'Category is required'),
    location: z.string().min(1, 'Location is required'),
    wattage: z.number().min(0, 'Wattage must be greater than or equal to 0'),
    voltage: z.number().min(0, 'Voltage must be greater than 0').optional(),
    homeId: z.string().min(1, 'Home is required'),
});

export const alertSchema = z.object({
    name: z.string().min(2, 'Alert name must be at least 2 characters'),
    type: z.enum(['threshold', 'anomaly', 'schedule']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    deviceId: z.string().min(1, 'Device is required'),
    conditions: z.object({
        metric: z.string().optional(),
        operator: z.string().optional(),
        value: z.number().optional(),
        duration: z.number().optional(),
    }),
    notifications: z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
    }),
});

export const reportSchema = z.object({
    type: z.enum(['consumption', 'comparison', 'anomaly']),
    homeId: z.string().min(1, 'Home is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    format: z.enum(['pdf', 'csv']).optional(),
});
