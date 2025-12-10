import api from './api';

export const alertService = {
    getAlerts: async (deviceId) => {
        const response = await api.get('/alerts', { params: { deviceId } });
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

    toggleAlert: async (id) => {
        const response = await api.patch(`/alerts/${id}/toggle`);
        return response.data;
    },

    getTriggeredAlerts: async (params) => {
        const response = await api.get('/alerts/triggered', { params });
        return response.data;
    },

    acknowledgeAlert: async (id) => {
        const response = await api.patch(`/alerts/triggered/${id}/acknowledge`);
        return response.data;
    },
};
