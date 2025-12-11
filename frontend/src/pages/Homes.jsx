import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MapPin, Zap, IndianRupee } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { homeService } from '../services/homeService';
import { formatCurrency, formatEnergy } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Default Indian tariff slabs
const DEFAULT_TARIFF_SLABS = [
    { limit: 100, rate: 3 },
    { limit: 200, rate: 5.50 },
    { limit: 200, rate: 7 },
    { limit: Infinity, rate: 8.50 },
];

const homeSchema = z.object({
    name: z.string().min(1, 'Home name is required'),
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits (e.g., 110001)'),
    tariffStructure: z.enum(['slab', 'flat']).default('slab'),
    electricityRate: z.coerce.number().min(0, 'Electricity rate must be positive').optional(),
    fixedCharges: z.coerce.number().min(0, 'Fixed charges must be positive').optional(),
});

const Homes = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tariffStructure, setTariffStructure] = useState('slab');
    const [tariffSlabs, setTariffSlabs] = useState(DEFAULT_TARIFF_SLABS);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: homeService.getHomes,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(homeSchema),
    });

    const createMutation = useMutation({
        mutationFn: homeService.createHome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homes'] });
            toast.success('Home added successfully');
            reset();
            setIsModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add home');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: homeService.deleteHome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homes'] });
            toast.success('Home deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete home');
        },
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this home?')) {
            deleteMutation.mutate(id);
        }
    };

    const onSubmit = (data) => {
        // Transform frontend slabs to backend format (minUnits/maxUnits)
        const backendSlabs = tariffStructure === 'slab' ? [
            { minUnits: 0, maxUnits: 100, rate: tariffSlabs[0].rate },
            { minUnits: 101, maxUnits: 300, rate: tariffSlabs[1].rate },
            { minUnits: 301, maxUnits: 500, rate: tariffSlabs[2].rate },
            { minUnits: 501, maxUnits: Infinity, rate: tariffSlabs[3].rate },
        ] : [];

        // Transform to backend expected format
        const payload = {
            name: data.name,
            zipCode: data.zipCode,
            address: {
                street: data.street,
                city: data.city,
                state: data.state,
            },
            country: 'India',
            tariffStructure: tariffStructure,
            electricityRate: data.electricityRate || 6,
            fixedCharges: data.fixedCharges || 50,
            tariffSlabs: backendSlabs,
        };
        createMutation.mutate(payload);
    };

    const updateSlabRate = (index, rate) => {
        const newSlabs = [...tariffSlabs];
        newSlabs[index] = { ...newSlabs[index], rate: parseFloat(rate) || 0 };
        setTariffSlabs(newSlabs);
    };

    const resetForm = () => {
        reset();
        setTariffStructure('slab');
        setTariffSlabs(DEFAULT_TARIFF_SLABS);
    };

    if (isLoading) {
        return (
            <DashboardLayout title="Homes">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    const homes = data?.homes || [];

    return (
        <DashboardLayout title="Homes">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Your Homes</h2>
                        <p className="text-sm text-gray-600">Manage your registered properties ({homes.length})</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Home
                    </Button>
                </div>

                {/* Homes Grid */}
                {homes.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <div className="mx-auto h-12 w-12 text-gray-400">
                                <MapPin className="h-12 w-12" />
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No homes</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by adding a new home.</p>
                            <div className="mt-6">
                                <Button onClick={() => setIsModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Home
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {homes.map((home) => (
                            <Card key={home._id} className="hover:shadow-md transition-shadow cursor-pointer">
                                <div onClick={() => navigate(`/homes/${home._id}`)}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{home.name}</h3>
                                            <p className="text-sm text-gray-600 flex items-center mt-1">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                {home.city}, {home.state}
                                            </p>
                                        </div>
                                        <Badge variant="primary">{home.devices?.length || 0} devices</Badge>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Square Footage</span>
                                            <span className="font-medium">{home.squareFootage?.toLocaleString() || 'N/A'} sq ft</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Bedrooms/Bathrooms</span>
                                            <span className="font-medium">{home.bedrooms || 0} / {home.bathrooms || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Tariff Type</span>
                                            <Badge variant={home.tariffStructure === 'slab' ? 'success' : 'primary'} className="text-xs">
                                                {home.tariffStructure === 'slab' ? 'Slab-based' : 'Flat Rate'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                                {home.tariffStructure === 'slab' ? 'Base Rate' : 'Rate'}
                                            </span>
                                            <span className="font-medium">{formatCurrency(home.electricityRate || 0)}/kWh</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-600">Consumption</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatEnergy(home.totalConsumption || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Cost</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(home.totalCost || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/homes/${home._id}`);
                                        }}
                                        className="flex-1"
                                    >
                                        <Zap className="h-4 w-4 mr-1" />
                                        View Details
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(home._id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Home Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Home"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Home Name */}
                    <Input
                        label="Home Name"
                        type="text"
                        placeholder="e.g., My House, Apartment"
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    {/* Address */}
                    <Input
                        label="Street Address"
                        type="text"
                        placeholder="e.g., 123 Main Street"
                        error={errors.street?.message}
                        {...register('street')}
                    />

                    {/* City */}
                    <Input
                        label="City"
                        type="text"
                        placeholder="e.g., Mumbai"
                        error={errors.city?.message}
                        {...register('city')}
                    />

                    {/* State */}
                    <Input
                        label="State"
                        type="text"
                        placeholder="e.g., Maharashtra"
                        error={errors.state?.message}
                        {...register('state')}
                    />

                    {/* PIN Code */}
                    <Input
                        label="PIN Code"
                        type="text"
                        placeholder="e.g., 400001"
                        error={errors.zipCode?.message}
                        {...register('zipCode')}
                    />

                    {/* Tariff Structure Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Tariff Structure
                        </label>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="slab"
                                    checked={tariffStructure === 'slab'}
                                    onChange={(e) => setTariffStructure(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Slab-based (Recommended for India)</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="flat"
                                    checked={tariffStructure === 'flat'}
                                    onChange={(e) => setTariffStructure(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Flat Rate</span>
                            </label>
                        </div>
                    </div>

                    {/* Slab Configuration */}
                    {tariffStructure === 'slab' && (
                        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                                <IndianRupee className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Tariff Slabs (₹/kWh)</span>
                            </div>
                            <p className="text-xs text-blue-600 mb-3">
                                Configure rates based on your state electricity board tariffs
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600 w-32">0-100 units:</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={tariffSlabs[0].rate}
                                        onChange={(e) => updateSlabRate(0, e.target.value)}
                                        className="w-24 text-sm"
                                        placeholder="₹3.00"
                                    />
                                    <span className="text-xs text-gray-500">₹/kWh</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600 w-32">101-300 units:</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={tariffSlabs[1].rate}
                                        onChange={(e) => updateSlabRate(1, e.target.value)}
                                        className="w-24 text-sm"
                                        placeholder="₹5.50"
                                    />
                                    <span className="text-xs text-gray-500">₹/kWh</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600 w-32">301-500 units:</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={tariffSlabs[2].rate}
                                        onChange={(e) => updateSlabRate(2, e.target.value)}
                                        className="w-24 text-sm"
                                        placeholder="₹7.00"
                                    />
                                    <span className="text-xs text-gray-500">₹/kWh</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600 w-32">Above 500 units:</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={tariffSlabs[3].rate}
                                        onChange={(e) => updateSlabRate(3, e.target.value)}
                                        className="w-24 text-sm"
                                        placeholder="₹8.50"
                                    />
                                    <span className="text-xs text-gray-500">₹/kWh</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Flat Rate (if selected) */}
                    {tariffStructure === 'flat' && (
                        <Input
                            label="Electricity Rate (₹/kWh)"
                            type="number"
                            step="0.01"
                            placeholder="e.g., 6"
                            error={errors.electricityRate?.message}
                            {...register('electricityRate')}
                        />
                    )}

                    {/* Fixed Charges */}
                    <Input
                        label="Fixed Charges (₹/month)"
                        type="number"
                        step="1"
                        placeholder="e.g., 50"
                        error={errors.fixedCharges?.message}
                        {...register('fixedCharges')}
                    />

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsModalOpen(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={createMutation.isPending}
                        >
                            Add Home
                        </Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Homes;
