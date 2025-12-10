import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const editDeviceSchema = z.object({
    name: z.string().min(1, 'Device name is required'),
    location: z.string().min(1, 'Location is required'),
    category: z.string().min(1, 'Category is required'),
    wattage: z.coerce.number().min(0, 'Wattage must be positive'),
});

const EditDeviceModal = ({ isOpen, onClose, onSuccess, device = null }) => {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        resolver: zodResolver(editDeviceSchema),
    });

    // Pre-fill form when device changes
    useEffect(() => {
        if (device && isOpen) {
            setValue('name', device.name || '');
            setValue('location', device.location || '');
            setValue('category', device.category || '');
            setValue('wattage', device.wattage || 0);
        }
    }, [device, isOpen, setValue]);

    const onSubmit = async (data) => {
        if (!device?._id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/devices/${device._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Device updated successfully!');
                reset();
                onClose();
                onSuccess?.();
            } else {
                toast.error(result.message || 'Failed to update device');
            }
        } catch (error) {
            toast.error('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Device">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                        Update Device
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditDeviceModal;
