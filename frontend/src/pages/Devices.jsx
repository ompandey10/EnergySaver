import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Plus, Power } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { deviceService } from '../services/deviceService';
import { formatEnergy, getStatusColor } from '../utils/helpers';

const Devices = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['devices'],
        queryFn: () => deviceService.getDevices(),
    });

    if (isLoading) {
        return (
            <DashboardLayout title="Devices">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    const devices = data?.data || [];

    return (
        <DashboardLayout title="Devices">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Your Devices</h2>
                        <p className="text-sm text-gray-600">Manage all your smart devices</p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Device
                    </Button>
                </div>

                {devices.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No devices</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by adding a new device.</p>
                            <div className="mt-6">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Device
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {devices.map((device) => (
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
                                        <span className="font-medium">{device.category}</span>
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

                                <Button variant="outline" size="sm" className="w-full">
                                    <Power className="h-4 w-4 mr-2" />
                                    Toggle
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Devices;
