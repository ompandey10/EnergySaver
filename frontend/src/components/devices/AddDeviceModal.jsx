import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { deviceService } from '../../services/deviceService';
import { AUTH_TOKEN_KEY } from '../../config/constants';

const deviceSchema = z.object({
    name: z.string().min(1, 'Device name is required'),
    location: z.string().min(1, 'Location is required'),
    category: z.string().min(1, 'Category is required'),
    wattage: z.coerce.number().min(0, 'Wattage must be positive'),
    homeId: z.string().min(1, 'Home is required'),
});

const AddDeviceModal = ({ isOpen, onClose, onSuccess, homes = [], deviceTemplates = [] }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
        watch,
    } = useForm({
        resolver: zodResolver(deviceSchema),
    });

    const homeId = watch('homeId');
    const category = watch('category');

    // Auto-populate wattage when template is selected
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setValue('category', template.category);
        setValue('wattage', template.wattage);
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Map UI category to backend-required type enum
            const categoryToType = {
                lighting: 'lighting',
                heating: 'hvac',
                cooling: 'hvac',
                kitchen: 'oven',
                entertainment: 'tv',
                other: 'other',
            };

            const payload = {
                homeId: data.homeId,
                name: data.name,
                type: categoryToType[data.category] || 'other',
                wattage: Number(data.wattage),
                location: data.location,
                brand: data.brand || '',
                model: data.model || '',
                isSmartDevice: false,
                averageUsageHours: 0,
            };

            const result = await deviceService.createDevice(payload);

            if (result.success) {
                toast.success('Device added successfully!');
                reset();
                setSelectedTemplate(null);
                onClose();
                onSuccess?.();
            } else {
                toast.error(result.message || 'Failed to add device');
            }
        } catch (error) {
            console.error('Error adding device:', error);
            toast.error(error.response?.data?.message || 'Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Device">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Home Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Home
                    </label>
                    {homes.length === 0 ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                            Loading homes...
                        </div>
                    ) : (
                        <select
                            {...register('homeId')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a home</option>
                            {homes.map((home) => (
                                <option key={home._id} value={home._id}>
                                    {home.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {errors.homeId && (
                        <p className="mt-1 text-sm text-red-600">{errors.homeId.message}</p>
                    )}
                </div>

                {/* Templates Suggestion */}
                {homeId && deviceTemplates.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Select from Templates
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {deviceTemplates.map((template) => (
                                <button
                                    key={template._id}
                                    type="button"
                                    onClick={() => handleTemplateSelect(template)}
                                    className={`p-3 text-sm rounded-lg border-2 transition-colors ${selectedTemplate?._id === template._id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <p className="font-medium text-gray-900">{template.name}</p>
                                    <p className="text-xs text-gray-600">{template.wattage}W</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Device Name */}
                <Input
                    label="Device Name"
                    type="text"
                    placeholder="e.g., Living Room Light"
                    error={errors.name?.message}
                    {...register('name')}
                />

                {/* Location */}
                <Input
                    label="Location"
                    type="text"
                    placeholder="e.g., Living Room"
                    error={errors.location?.message}
                    {...register('location')}
                />

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                    </label>
                    <select
                        {...register('category')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select a category</option>
                        <option value="lighting">Lighting</option>
                        <option value="heating">Heating</option>
                        <option value="cooling">Cooling</option>
                        <option value="kitchen">Kitchen Appliances</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="other">Other</option>
                    </select>
                    {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                </div>

                {/* Wattage */}
                <Input
                    label="Rated Wattage (W)"
                    type="number"
                    placeholder="e.g., 60"
                    error={errors.wattage?.message}
                    {...register('wattage')}
                />

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading}
                    >
                        Add Device
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDeviceModal;
