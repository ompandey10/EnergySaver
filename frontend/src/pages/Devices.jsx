import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Plus, Power, Search, Zap, Clock, Activity } from 'lucide-react';
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
import { formatEnergy, formatCurrency } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

// Helper to format running time
const formatRunningTime = (startDate) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (diffHours > 0) {
        return `${diffHours}h ${mins}m`;
    }
    return `${mins}m`;
};

// Device Card Component with real-time consumption tracking
const DeviceCard = ({ device, onToggle }) => {
    const navigate = useNavigate();
    const [consumption, setConsumption] = useState(null);
    const [runningTime, setRunningTime] = useState(null);
    const [isToggling, setIsToggling] = useState(false);
    const intervalRef = useRef(null);
    const consumptionIntervalRef = useRef(null);

    const isOn = device.isActive || device.isOn;

    // Fetch consumption data and update running time
    useEffect(() => {
        const fetchConsumption = async () => {
            try {
                const data = await deviceService.getCurrentConsumption(device._id);
                setConsumption(data.consumption);
            } catch (error) {
                console.error('Error fetching consumption:', error);
            }
        };

        // Initial fetch
        fetchConsumption();

        // If device is on, update running time every second and consumption every 5 seconds
        if (isOn && device.lastTurnedOn) {
            setRunningTime(formatRunningTime(device.lastTurnedOn));

            // Update running time every second
            intervalRef.current = setInterval(() => {
                setRunningTime(formatRunningTime(device.lastTurnedOn));
            }, 1000);

            // Update consumption every 5 seconds
            consumptionIntervalRef.current = setInterval(() => {
                fetchConsumption();
            }, 5000);
        } else {
            setRunningTime(null);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (consumptionIntervalRef.current) {
                clearInterval(consumptionIntervalRef.current);
            }
        };
    }, [device._id, isOn, device.lastTurnedOn]);

    const handleToggle = async (e) => {
        e.stopPropagation();
        setIsToggling(true);
        try {
            await onToggle(device._id);
        } finally {
            setIsToggling(false);
        }
    };

    const handleClick = () => {
        navigate(`/devices/${device._id}`);
    };

    const getDeviceIcon = () => {
        const type = device.type || device.category || '';
        switch (type.toLowerCase()) {
            case 'hvac':
            case 'air_conditioner':
                return '❄️';
            case 'lighting':
            case 'light':
                return '💡';
            case 'refrigerator':
            case 'appliance':
                return '🏠';
            case 'washer':
            case 'dryer':
                return '👕';
            case 'entertainment':
            case 'tv':
                return '📺';
            default:
                return '⚡';
        }
    };

    return (
        <Card
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${isOn ? 'ring-2 ring-green-400 bg-green-50/30' : ''}`}
            onClick={handleClick}
        >
            <div className="p-4">
                {/* Header with device icon and power toggle */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <div className={`text-2xl p-2 rounded-lg ${isOn ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {getDeviceIcon()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{device.name}</h3>
                            <p className="text-xs text-gray-500">{device.location || 'No location'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggle}
                        disabled={isToggling}
                        className={`p-2 rounded-full transition-all duration-200 ${isOn
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Power className={`h-5 w-5 ${isToggling ? 'animate-pulse' : ''}`} />
                    </button>
                </div>

                {/* Status Badge */}
                <div className="flex items-center space-x-2 mb-3">
                    <Badge variant={isOn ? 'success' : 'secondary'}>
                        {isOn ? 'Active' : 'Off'}
                    </Badge>
                    {isOn && (
                        <span className="flex items-center text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                            Live
                        </span>
                    )}
                </div>

                {/* Power Rating */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                    <span>{device.powerRating || 0}W rated power</span>
                </div>

                {/* Running Time (when device is on) */}
                {isOn && runningTime && (
                    <div className="flex items-center text-sm text-green-600 mb-3 bg-green-100 px-2 py-1 rounded">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Running for {runningTime}</span>
                    </div>
                )}

                {/* Current Session Stats (when device is on) */}
                {isOn && consumption && (
                    <div className="border-t pt-3 mt-3">
                        <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-xs font-medium text-green-700 mb-2 flex items-center">
                                <Activity className="h-3 w-3 mr-1" />
                                Live Consumption
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-xs text-green-600">Current Power</div>
                                    <div className="font-semibold text-green-700">{consumption.currentWatts || 0}W</div>
                                </div>
                                <div>
                                    <div className="text-xs text-green-600">Session Energy</div>
                                    <div className="font-semibold text-green-700">{consumption.sessionKWh?.toFixed(4) || '0.0000'} kWh</div>
                                </div>
                                <div>
                                    <div className="text-xs text-green-600">Duration</div>
                                    <div className="font-semibold text-green-700">{consumption.sessionDuration?.toFixed(1) || '0'} min</div>
                                </div>
                                <div>
                                    <div className="text-xs text-orange-600">Est. Cost</div>
                                    <div className="font-bold text-orange-600">₹{consumption.sessionCost?.toFixed(4) || '0.0000'}</div>
                                </div>
                            </div>
                            {/* Rate info */}
                            <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-500">
                                Rate: ₹{consumption.electricityRate?.toFixed(2) || '8'}/kWh
                            </div>
                        </div>
                    </div>
                )}

                {/* Off state message */}
                {!isOn && (
                    <div className="border-t pt-3 mt-3">
                        <div className="text-xs text-gray-500 text-center">
                            Turn on device to start tracking consumption
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

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

    const handleToggleDevice = async (deviceId) => {
        try {
            const response = await deviceService.toggleDevice(deviceId);
            const isNowActive = response.device?.isActive;
            toast.success(`Device ${isNowActive ? 'turned on - consumption tracking started' : 'turned off - consumption recorded'}`);
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
                            <DeviceCard
                                key={device._id}
                                device={device}
                                onToggle={handleToggleDevice}
                            />
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
