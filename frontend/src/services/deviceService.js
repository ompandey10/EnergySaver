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

  getDeviceDetail: async (id, params) => {
    // Get device info and readings
    const [deviceRes, readingsRes] = await Promise.all([
      api.get(`/devices/${id}`),
      api.get(`/devices/${id}/readings`, { params }),
    ]);
    return {
      data: {
        ...deviceRes.data.data,
        readings: readingsRes.data.data,
      },
    };
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

  toggleDevice: async (id, currentState) => {
    // First fetch the full device data
    const deviceRes = await api.get(`/devices/${id}`);
    const device = deviceRes.data.device || deviceRes.data.data;

    if (!device) {
      throw new Error('Device not found');
    }

    // Get homeId - handle both populated object and direct ID
    const homeId = device.home?._id || device.home || device.homeId;

    // Send update with all required fields and toggled isActive
    const response = await api.put(`/devices/${id}`, {
      homeId: homeId,
      name: device.name,
      type: device.type,
      wattage: device.wattage,
      location: device.location || '',
      brand: device.brand || '',
      model: device.model || '',
      isSmartDevice: device.isSmartDevice || false,
      averageUsageHours: device.averageUsageHours || 0,
      isActive: !currentState,
    });
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

