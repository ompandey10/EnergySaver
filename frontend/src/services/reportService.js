import api from './api';

export const reportService = {
    generateReport: async (reportData) => {
        const response = await api.post('/reports/generate', reportData);
        return response.data;
    },

    getConsumptionReport: async (homeId, params) => {
        const response = await api.get(`/reports/consumption/${homeId}`, { params });
        return response.data;
    },

    getComparisonReport: async (params) => {
        const response = await api.get('/reports/comparison', { params });
        return response.data;
    },

    getAnomalies: async (deviceId, params) => {
        const response = await api.get(`/reports/anomalies/${deviceId}`, { params });
        return response.data;
    },

    getSavingsTips: async (homeId) => {
        const response = await api.get(`/reports/tips/${homeId}`);
        return response.data;
    },

    downloadReport: async (reportId) => {
        const response = await api.get(`/reports/download/${reportId}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};
