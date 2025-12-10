import { clsx } from 'clsx';

export const cn = (...inputs) => {
    return clsx(inputs);
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const formatNumber = (number, decimals = 2) => {
    return Number(number).toFixed(decimals);
};

export const formatEnergy = (kwh) => {
    if (kwh >= 1000) {
        return `${formatNumber(kwh / 1000, 2)} MWh`;
    }
    return `${formatNumber(kwh, 2)} kWh`;
};

export const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
};

export const getAlertColor = (severity) => {
    const colors = {
        low: 'text-blue-600 bg-blue-50',
        medium: 'text-yellow-600 bg-yellow-50',
        high: 'text-orange-600 bg-orange-50',
        critical: 'text-red-600 bg-red-50',
    };
    return colors[severity] || colors.low;
};

export const getStatusColor = (status) => {
    const colors = {
        active: 'text-green-600 bg-green-50',
        inactive: 'text-gray-600 bg-gray-50',
        error: 'text-red-600 bg-red-50',
        warning: 'text-yellow-600 bg-yellow-50',
    };
    return colors[status] || colors.inactive;
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const truncate = (str, length = 50) => {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
};
