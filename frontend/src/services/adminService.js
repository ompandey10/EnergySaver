import api from './api';

export const adminService = {
    // Users
    getUsers: async (params) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    getUserById: async (id) => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await api.put(`/admin/users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },

    // Platform Stats
    getPlatformStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // Device Templates
    getDeviceTemplates: async () => {
        const response = await api.get('/admin/devices/templates');
        return response.data;
    },

    createDeviceTemplate: async (templateData) => {
        const response = await api.post('/admin/devices/templates', templateData);
        return response.data;
    },

    updateDeviceTemplate: async (id, templateData) => {
        const response = await api.put(`/admin/devices/templates/${id}`, templateData);
        return response.data;
    },

    deleteDeviceTemplate: async (id) => {
        const response = await api.delete(`/admin/devices/templates/${id}`);
        return response.data;
    },

    // Community Insights
    getCommunityInsights: async (params) => {
        const response = await api.get('/admin/insights', { params });
        return response.data;
    },

    // Analytics
    getAnalytics: async (params) => {
        const response = await api.get('/admin/analytics', { params });
        return response.data;
    },
};
