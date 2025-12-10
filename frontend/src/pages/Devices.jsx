import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Plus, Power, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import AddDeviceModal from '../components/devices/AddDeviceModal';
import { deviceService } from '../services/deviceService';
import { homeService } from '../services/homeService';
import { formatEnergy, getStatusColor } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

const Devices = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // First get user's homes
    const { data: homesData, isLoading: homesLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: () => homeService.getHomes(),
        enabled: !!user,
    });

    // Get device templates
    const { data: templatesData } = useQuery({
        queryKey: ['deviceTemplates'],
        queryFn: () => deviceService.getDeviceTemplates(),
        enabled: !!user,
    });

    const primaryHomeId = homesData?.homes?.[0]?._id;

    // Then get devices for the primary home
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['devices', primaryHomeId],
        queryFn: () => deviceService.getDevices(primaryHomeId),
        enabled: !!primaryHomeId,
    });

    const handleAddSuccess = () => {
        setIsAddModalOpen(false);
        // Invalidate and refetch devices
        queryClient.invalidateQueries({ queryKey: ['devices', primaryHomeId] });
    };

    const handleToggleDevice = async (deviceId, currentState) => {
        try {
            await deviceService.toggleDevice(deviceId, currentState);
            toast.success(`Device ${currentState ? 'turned off' : 'turned on'} successfully!`);
            // Refetch devices to get updated state
            queryClient.invalidateQueries({ queryKey: ['devices', primaryHomeId] });
        } catch (error) {
            toast.error('Failed to toggle device');
            console.error('Error toggling device:', error);
        }
    };

    const devices = data?.devices || [];
    const hasHomes = homesData?.homes?.length > 0;

    // Filter devices based on search term
    const filteredDevices = devices.filter(device => {
        const term = searchTerm.toLowerCase();
        const typeVal = (device.type || device.category || '').toLowerCase();
        return (
            device.name.toLowerCase().includes(term) ||
            (device.location || '').toLowerCase().includes(term) ||
            typeVal.includes(term)
        );
    });

    // Show message if user has no homes
    if (!homesLoading && !hasHomes) {
        return (
            <DashboardLayout title="Devices">
                <Card>
                    <div className="text-center py-12">
                        <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No Home Found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            You need to create a home before adding devices.
                        </p>
                        <div className="mt-6">
                            <Button onClick={() => navigate('/homes')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Go to Homes
                            </Button>
                        </div>
                    </div>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Devices">
            <div className="space-y-6">
                {/* Header and Add Button */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Your Devices</h2>
                        <p className="text-sm text-gray-600">Manage all your smart devices ({devices.length})</p>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Device
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search devices by name, location, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner size="lg" />
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {devices.length === 0 ? 'No devices' : 'No devices found'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {devices.length === 0 ? 'Get started by adding a new device.' : 'Try adjusting your search criteria.'}
                            </p>
                            {devices.length === 0 && (
                                <div className="mt-6">
                                    <Button onClick={() => setIsAddModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Device
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDevices.map((device) => (
                            <Card key={device._id}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${device.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            <Lightbulb className={`h-6 w-6 ${device.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">{device.name}</h3>
                                            <p className="text-xs text-gray-600">{device.location}</p>
                                        </div>
                                    </div>
                                    <Badge variant={device.isActive ? 'success' : 'default'}>
                                        {device.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Category</span>
                                        <span className="font-medium">{device.type || device.category}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Wattage</span>
                                        <span className="font-medium">{device.wattage}W</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Consumption</span>
                                        <span className="font-medium">{formatEnergy(device.totalConsumption || 0)}</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleToggleDevice(device._id, device.isActive)}
                                >
                                    <Power className={`h-4 w-4 mr-2 ${device.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                    {device.isActive ? 'Turn Off' : 'Turn On'}
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Add Device Modal */}
                <AddDeviceModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={handleAddSuccess}
                    homes={!homesLoading ? (homesData?.homes || []) : []}
                    deviceTemplates={templatesData?.templates || []}
                />
            </div>
        </DashboardLayout>
    );
};

export default Devices;
