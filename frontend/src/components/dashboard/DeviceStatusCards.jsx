import { useState, useEffect, useRef } from 'react';
import { Power, Edit, Trash2, Zap, ChevronRight, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatEnergy } from '../../utils/helpers';
import { deviceService } from '../../services/deviceService';

const getDeviceIcon = (category) => {
    const icons = {
        'lighting': '💡',
        'heating': '🔥',
        'cooling': '❄️',
        'kitchen': '🍳',
        'entertainment': '📺',
        'other': '⚙️'
    };
    return icons[category?.toLowerCase()] || '⚙️';
};

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

// Individual Device Card with live consumption
const DeviceStatusCard = ({ device, onEdit, onDelete, onToggle, isHovered, setHovered }) => {
    const navigate = useNavigate();
    const [consumption, setConsumption] = useState(null);
    const [runningTime, setRunningTime] = useState(null);
    const intervalRef = useRef(null);
    const consumptionIntervalRef = useRef(null);

    const isOn = device.isActive;

    useEffect(() => {
        const fetchConsumption = async () => {
            try {
                const data = await deviceService.getCurrentConsumption(device._id);
                setConsumption(data.consumption);
            } catch (error) {
                console.error('Error fetching consumption:', error);
            }
        };

        if (isOn) {
            fetchConsumption();

            if (device.lastTurnedOn) {
                setRunningTime(formatRunningTime(device.lastTurnedOn));
                intervalRef.current = setInterval(() => {
                    setRunningTime(formatRunningTime(device.lastTurnedOn));
                }, 1000);
            }

            consumptionIntervalRef.current = setInterval(fetchConsumption, 5000);
        } else {
            setRunningTime(null);
            setConsumption(null);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (consumptionIntervalRef.current) clearInterval(consumptionIntervalRef.current);
        };
    }, [device._id, isOn, device.lastTurnedOn]);

    return (
        <div
            onMouseEnter={() => setHovered(device._id)}
            onMouseLeave={() => setHovered(null)}
            className="relative h-full"
        >
            <Card className={`h-full hover:shadow-lg transition-all ${isOn ? 'ring-2 ring-green-400 bg-green-50/30' : ''}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1">
                            <div className={`text-3xl flex-shrink-0 relative ${isOn ? 'opacity-100' : 'opacity-50'}`}>
                                {getDeviceIcon(device.category)}
                                {isOn && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                    {device.name}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                    {device.location || device.category}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                            <Badge
                                variant={isOn ? 'success' : 'secondary'}
                                className="flex-shrink-0"
                            >
                                {isOn ? 'On' : 'Off'}
                            </Badge>
                            {isOn && (
                                <span className="flex items-center text-xs text-green-600">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                                    Live
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Live Stats when on */}
                    {isOn && (
                        <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-green-700 flex items-center">
                                    <Activity className="h-3 w-3 mr-1" />
                                    Live Consumption
                                </span>
                                {runningTime && (
                                    <span className="text-xs text-green-600 flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {runningTime}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-xs text-green-600">Power</div>
                                    <div className="text-lg font-bold text-green-600">
                                        {consumption?.currentWatts || device.wattage || 0}W
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-green-600">Energy</div>
                                    <div className="text-lg font-bold text-green-700">
                                        {consumption?.sessionKWh?.toFixed(4) || '0.0000'} kWh
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-green-600">Duration</div>
                                    <div className="font-semibold text-green-700">
                                        {consumption?.sessionDuration?.toFixed(1) || '0'} min
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-orange-600 font-medium">Cost</div>
                                    <div className="text-lg font-bold text-orange-600">
                                        ₹{consumption?.sessionCost?.toFixed(4) || '0.0000'}
                                    </div>
                                </div>
                            </div>
                            {/* Rate info */}
                            <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-500 text-center">
                                Rate: ₹{consumption?.electricityRate?.toFixed(2) || '8'}/kWh
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="space-y-3 flex-1 mb-4 pb-4 border-b border-gray-200">
                        {!isOn && (
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-gray-600">Rated Power</span>
                                <span className="text-lg font-bold text-blue-600">
                                    {device.wattage || 0}W
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-gray-600">Today</span>
                            <span className="text-sm font-semibold text-gray-900">
                                {formatEnergy(device.dailyConsumption || 0)}
                            </span>
                        </div>
                        {device.weeklyConsumption && (
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-gray-600">This Week</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {formatEnergy(device.weeklyConsumption)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs text-gray-600">Efficiency</span>
                            <span className="text-xs font-medium text-gray-900">
                                {device.efficiency || 75}%
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${(device.efficiency || 75) >= 80
                                    ? 'bg-green-500'
                                    : 'bg-yellow-500'
                                    }`}
                                style={{ width: `${device.efficiency || 75}%` }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={`flex gap-2 transition-all ${isHovered ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                        }`}>
                        <button
                            onClick={() => onToggle?.(device._id)}
                            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isOn
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                            title={isOn ? 'Turn off' : 'Turn on'}
                        >
                            <Power className="h-4 w-4" />
                            <span className="hidden sm:inline">{isOn ? 'Off' : 'On'}</span>
                        </button>
                        <button
                            onClick={() => navigate(`/devices/${device._id}`)}
                            className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            title="View details"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onEdit?.(device._id)}
                            className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            title="Edit device"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete?.(device._id)}
                            className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete device"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const DeviceStatusCards = ({ devices = [], onEdit, onDelete, onToggle }) => {
    const [hoveredId, setHoveredId] = useState(null);

    if (!devices || devices.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
                <Card>
                    <div className="text-center py-12">
                        <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">No devices available</p>
                    </div>
                </Card>
            </div>
        );
    }

    const activeDevices = devices.filter(d => d.isActive);
    const inactiveDevices = devices.filter(d => !d.isActive);

    return (
        <div className="space-y-6">
            {/* Active Devices Section */}
            {activeDevices.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">Active Devices</h3>
                        <span className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                            {activeDevices.length} running
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeDevices.map((device) => (
                            <DeviceStatusCard
                                key={device._id}
                                device={device}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggle={onToggle}
                                isHovered={hoveredId === device._id}
                                setHovered={setHoveredId}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Inactive Devices Section */}
            {inactiveDevices.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {activeDevices.length > 0 ? 'Inactive Devices' : 'Device Status'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inactiveDevices.map((device) => (
                            <DeviceStatusCard
                                key={device._id}
                                device={device}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggle={onToggle}
                                isHovered={hoveredId === device._id}
                                setHovered={setHoveredId}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceStatusCards;