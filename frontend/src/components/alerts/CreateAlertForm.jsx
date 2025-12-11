import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Home, Lightbulb } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { homeService } from '../../services/homeService';
import { deviceService } from '../../services/deviceService';

const CreateAlertForm = ({ isOpen, onClose, onSubmit, editingAlert = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'usage_limit',
        scope: 'device', // 'home' or 'device'
        homeId: '',
        deviceId: '',
        limitKWh: '',
        limitCost: '',
        period: 'daily',
        threshold: 80,
        isEnabled: true,
        notificationMethods: ['in_app'],
    });
    const [errors, setErrors] = useState({});

    // Fetch homes
    const { data: homesData } = useQuery({
        queryKey: ['homes'],
        queryFn: () => homeService.getHomes(),
    });

    // Fetch devices for selected home
    const { data: devicesData } = useQuery({
        queryKey: ['devices', formData.homeId],
        queryFn: () => deviceService.getDevices(formData.homeId),
        enabled: !!formData.homeId,
    });

    const homes = homesData?.homes || [];
    const devices = devicesData?.devices || [];

    // Populate form when editing
    useEffect(() => {
        if (editingAlert) {
            setFormData({
                name: editingAlert.name || '',
                type: editingAlert.type || 'usage_limit',
                scope: editingAlert.device ? 'device' : 'home',
                homeId: editingAlert.home?._id || editingAlert.home || '',
                deviceId: editingAlert.device?._id || editingAlert.device || '',
                limitKWh: editingAlert.limitKWh || '',
                limitCost: editingAlert.limitCost || '',
                period: editingAlert.period || 'daily',
                threshold: editingAlert.threshold || 80,
                isEnabled: editingAlert.isEnabled !== false,
                notificationMethods: editingAlert.notificationMethods || ['in_app'],
            });
        } else {
            // Reset form for new alert
            setFormData({
                name: '',
                type: 'usage_limit',
                scope: 'device',
                homeId: '',
                deviceId: '',
                limitKWh: '',
                limitCost: '',
                period: 'daily',
                threshold: 80,
                isEnabled: true,
                notificationMethods: ['in_app'],
            });
        }
    }, [editingAlert, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error when field is changed
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleNotificationMethodChange = (method) => {
        setFormData(prev => ({
            ...prev,
            notificationMethods: prev.notificationMethods.includes(method)
                ? prev.notificationMethods.filter(m => m !== method)
                : [...prev.notificationMethods, method],
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Alert name is required';
        }
        if (!formData.homeId) {
            newErrors.homeId = 'Please select a home';
        }
        if (formData.scope === 'device' && !formData.deviceId) {
            newErrors.deviceId = 'Please select a device';
        }
        if (formData.type === 'usage_limit' && !formData.limitKWh) {
            newErrors.limitKWh = 'Please enter a kWh limit';
        }
        if (formData.type === 'cost_limit' && !formData.limitCost) {
            newErrors.limitCost = 'Please enter a cost limit';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const alertData = {
            name: formData.name,
            type: formData.type,
            period: formData.period,
            threshold: Number(formData.threshold),
            isEnabled: formData.isEnabled,
            notificationMethods: formData.notificationMethods,
        };

        if (formData.scope === 'home') {
            alertData.homeId = formData.homeId;
        } else {
            alertData.deviceId = formData.deviceId;
            alertData.homeId = formData.homeId;
        }

        if (formData.type === 'usage_limit') {
            alertData.limitKWh = Number(formData.limitKWh);
        } else if (formData.type === 'cost_limit') {
            alertData.limitCost = Number(formData.limitCost);
        }

        onSubmit(alertData, editingAlert?._id);
    };

    const alertTypes = [
        { value: 'usage_limit', label: 'Usage Limit (kWh)' },
        { value: 'cost_limit', label: 'Cost Limit ($)' },
        { value: 'unusual_activity', label: 'Unusual Activity' },
        { value: 'device_offline', label: 'Device Offline' },
    ];

    const periods = [
        { value: 'hourly', label: 'Hourly' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
    ];

    const notificationOptions = [
        { value: 'in_app', label: 'In-App' },
        { value: 'email', label: 'Email' },
        { value: 'push', label: 'Push Notification' },
        { value: 'sms', label: 'SMS' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingAlert ? 'Edit Alert' : 'Create New Alert'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alert Name */}
                <Input
                    label="Alert Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., High HVAC Usage Alert"
                    error={errors.name}
                    icon={AlertTriangle}
                />

                {/* Alert Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alert Type
                    </label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        {alertTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Scope Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monitor
                    </label>
                    <div className="flex space-x-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="scope"
                                value="home"
                                checked={formData.scope === 'home'}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 flex items-center text-sm text-gray-700">
                                <Home className="h-4 w-4 mr-1" /> Entire Home
                            </span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="scope"
                                value="device"
                                checked={formData.scope === 'device'}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 flex items-center text-sm text-gray-700">
                                <Lightbulb className="h-4 w-4 mr-1" /> Specific Device
                            </span>
                        </label>
                    </div>
                </div>

                {/* Home Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Home
                    </label>
                    <select
                        name="homeId"
                        value={formData.homeId}
                        onChange={handleChange}
                        className={`block w-full rounded-lg border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.homeId ? 'border-red-500' : 'border-gray-300'
                            }`}
                    >
                        <option value="">Select a home</option>
                        {homes.map(home => (
                            <option key={home._id} value={home._id}>
                                {home.name}
                            </option>
                        ))}
                    </select>
                    {errors.homeId && (
                        <p className="mt-1 text-sm text-red-600">{errors.homeId}</p>
                    )}
                </div>

                {/* Device Selection (if scope is device) */}
                {formData.scope === 'device' && formData.homeId && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Device
                        </label>
                        <select
                            name="deviceId"
                            value={formData.deviceId}
                            onChange={handleChange}
                            className={`block w-full rounded-lg border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.deviceId ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Select a device</option>
                            {devices.map(device => (
                                <option key={device._id} value={device._id}>
                                    {device.name} ({device.type})
                                </option>
                            ))}
                        </select>
                        {errors.deviceId && (
                            <p className="mt-1 text-sm text-red-600">{errors.deviceId}</p>
                        )}
                    </div>
                )}

                {/* Limit Input based on type */}
                {formData.type === 'usage_limit' && (
                    <Input
                        label="Usage Limit (kWh)"
                        name="limitKWh"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.limitKWh}
                        onChange={handleChange}
                        placeholder="e.g., 50"
                        error={errors.limitKWh}
                    />
                )}

                {formData.type === 'cost_limit' && (
                    <Input
                        label="Cost Limit ($)"
                        name="limitCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.limitCost}
                        onChange={handleChange}
                        placeholder="e.g., 25.00"
                        error={errors.limitCost}
                    />
                )}

                {/* Period Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Period
                    </label>
                    <select
                        name="period"
                        value={formData.period}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        {periods.map(period => (
                            <option key={period.value} value={period.value}>
                                {period.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Threshold Slider */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alert Threshold: {formData.threshold}%
                    </label>
                    <input
                        type="range"
                        name="threshold"
                        min="10"
                        max="100"
                        step="5"
                        value={formData.threshold}
                        onChange={handleChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Alert when {formData.threshold}% of limit is reached
                    </p>
                </div>

                {/* Notification Methods */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notification Methods
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {notificationOptions.map(option => (
                            <label key={option.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.notificationMethods.includes(option.value)}
                                    onChange={() => handleNotificationMethodChange(option.value)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Enable Alert</p>
                        <p className="text-xs text-gray-500">Receive notifications when triggered</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="isEnabled"
                            checked={formData.isEnabled}
                            onChange={handleChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {editingAlert ? 'Update Alert' : 'Create Alert'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateAlertForm;
