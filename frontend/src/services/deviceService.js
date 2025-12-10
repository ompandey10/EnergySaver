import api from './api';

export const deviceService = {
  getDevices: async (homeId) => {
    const response = await api.get(`/devices/home/${homeId}`);
    return response.data;
  },

  getDeviceById: async (id) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  createDevice: async (deviceData) => {
    const response = await api.post('/devices', deviceData);
    return response.data;
  },

  updateDevice: async (id, deviceData) => {
    const response = await api.put(`/devices/${id}`, deviceData);
    return response.data;
  },

  deleteDevice: async (id) => {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  },

  toggleDevice: async (id) => {
    const response = await api.patch(`/devices/${id}/toggle`);
    return response.data;
  },

  getDeviceReadings: async (id, params) => {
    const response = await api.get(`/devices/${id}/readings`, { params });
    return response.data;
  },

  getDeviceTemplates: async () => {
    const response = await api.get('/devices/templates');
    return response.data;
  },

  simulateReadings: async (deviceId) => {
    const response = await api.post(`/devices/${deviceId}/simulate`);
    return response.data;
  },
};
