import api from './api';

export const alertService = {
    getAlerts: async (params) => {
        const response = await api.get('/alerts/user', { params });
        return response.data;
    },

    getAlertById: async (id) => {
        const response = await api.get(`/alerts/${id}`);
        return response.data;
    },

    createAlert: async (alertData) => {
        const response = await api.post('/alerts', alertData);
        return response.data;
    },

    updateAlert: async (id, alertData) => {
        const response = await api.put(`/alerts/${id}`, alertData);
        return response.data;
    },

    deleteAlert: async (id) => {
        const response = await api.delete(`/alerts/${id}`);
        return response.data;
    },

    toggleAlert: async (id, isEnabled) => {
        const response = await api.put(`/alerts/${id}`, { isEnabled });
        return response.data;
    },

    getTriggeredAlerts: async (params) => {
        const response = await api.get('/alerts/triggered', { params });
        return response.data;
    },

    markTriggeredAlertRead: async (id) => {
        const response = await api.put(`/alerts/triggered/${id}/read`);
        return response.data;
    },

    markTriggeredAlertResolved: async (id) => {
        const response = await api.put(`/alerts/triggered/${id}/resolve`);
        return response.data;
    },
};
