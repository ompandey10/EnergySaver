import { useState } from 'react';
import { Power, Edit, Trash2, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatEnergy } from '../../utils/helpers';

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

const DeviceStatusCards = ({ devices = [], onEdit, onDelete, onToggle }) => {
    const navigate = useNavigate();
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

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => (
                    <div
                        key={device._id}
                        onMouseEnter={() => setHoveredId(device._id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className="relative h-full"
                    >
                        <Card className="h-full hover:shadow-lg transition-shadow">
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className={`text-3xl flex-shrink-0 ${device.isActive ? 'opacity-100' : 'opacity-50'}`}>
                                            {getDeviceIcon(device.category)}
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
                                    <Badge
                                        variant={device.isActive ? 'success' : 'secondary'}
                                        className="flex-shrink-0"
                                    >
                                        {device.isActive ? 'On' : 'Off'}
                                    </Badge>
                                </div>

                                {/* Stats */}
                                <div className="space-y-3 flex-1 mb-4 pb-4 border-b border-gray-200">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-gray-600">Current</span>
                                        <span className="text-lg font-bold text-blue-600">
                                            {device.currentConsumption || device.wattage || 0}W
                                        </span>
                                    </div>
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
                                <div className={`flex gap-2 transition-all ${hoveredId === device._id ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                                    }`}>
                                    <button
                                        onClick={() => onToggle?.(device._id)}
                                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                                        title={device.isActive ? 'Turn off' : 'Turn on'}
                                    >
                                        <Power className="h-4 w-4" />
                                        <span className="hidden sm:inline">{device.isActive ? 'Off' : 'On'}</span>
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
                ))}
            </div>
        </div>
    );
};

export default DeviceStatusCards;
