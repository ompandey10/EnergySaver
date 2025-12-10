import api from './api';

export const homeService = {
    getHomes: async () => {
        const response = await api.get('/homes');
        return response.data;
    },

    getHomeById: async (id) => {
        const response = await api.get(`/homes/${id}`);
        return response.data;
    },

    createHome: async (homeData) => {
        const response = await api.post('/homes', homeData);
        return response.data;
    },

    updateHome: async (id, homeData) => {
        const response = await api.put(`/homes/${id}`, homeData);
        return response.data;
    },

    deleteHome: async (id) => {
        const response = await api.delete(`/homes/${id}`);
        return response.data;
    },

    getHomeStats: async (id) => {
        const response = await api.get(`/homes/${id}/stats`);
        return response.data;
    },

    getHomeConsumption: async (id, params) => {
        const response = await api.get(`/homes/${id}/consumption`, { params });
        return response.data;
    },
};
