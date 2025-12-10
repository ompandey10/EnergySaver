import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MapPin, Zap } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { homeService } from '../services/homeService';
import { formatCurrency, formatEnergy } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Homes = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: homeService.getHomes,
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

    if (isLoading) {
        return (
            <DashboardLayout title="Homes">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    const homes = data?.data || [];

    return (
        <DashboardLayout title="Homes">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Your Homes</h2>
                        <p className="text-sm text-gray-600">Manage your registered properties</p>
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
                                            <span className="text-gray-600">Electricity Rate</span>
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

            {/* Add Home Modal - Placeholder */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Home"
            >
                <p className="text-gray-600">Home creation form will be implemented here.</p>
            </Modal>
        </DashboardLayout>
    );
};

export default Homes;
