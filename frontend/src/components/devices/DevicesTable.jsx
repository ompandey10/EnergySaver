import { useState } from 'react';
import { Search, ChevronUp, ChevronDown, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatEnergy } from '../../utils/helpers';

const DevicesTable = ({ devices = [], onEdit, onDelete, onView, isLoading = false }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [filterCategory, setFilterCategory] = useState('all');

    // Get unique categories
    const categories = ['all', ...new Set(devices.map(d => d.category || 'other'))];

    // Filter and sort devices
    const filteredDevices = devices
        .filter(device => {
            const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.location?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || device.category === filterCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <div className="h-4 w-4" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />;
    };

    return (
        <Card>
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Devices</h3>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 pb-4 border-b border-gray-200">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                {filteredDevices.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No devices found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-6 py-3 text-left">
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center space-x-2 font-semibold text-gray-900 hover:text-blue-600"
                                        >
                                            <span>Device Name</span>
                                            <SortIcon column="name" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <button
                                            onClick={() => handleSort('location')}
                                            className="flex items-center space-x-2 font-semibold text-gray-900 hover:text-blue-600"
                                        >
                                            <span>Location</span>
                                            <SortIcon column="location" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <button
                                            onClick={() => handleSort('category')}
                                            className="flex items-center space-x-2 font-semibold text-gray-900 hover:text-blue-600"
                                        >
                                            <span>Category</span>
                                            <SortIcon column="category" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <button
                                            onClick={() => handleSort('wattage')}
                                            className="flex items-center space-x-2 font-semibold text-gray-900 hover:text-blue-600"
                                        >
                                            <span>Wattage</span>
                                            <SortIcon column="wattage" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-900">
                                        Today's Usage
                                    </th>
                                    <th className="px-6 py-3 text-center font-semibold text-gray-900">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDevices.map((device) => (
                                    <tr
                                        key={device._id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{device.name}</p>
                                                <p className="text-sm text-gray-500">{device.serialNumber}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {device.location || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                                                {device.category || 'Other'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-medium">
                                            {device.wattage}W
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={device.isActive ? 'success' : 'secondary'}>
                                                {device.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-medium">
                                            {formatEnergy(device.dailyConsumption || 0)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => onView?.(device._id)}
                                                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEdit?.(device._id)}
                                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                                                    title="Edit device"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete?.(device._id)}
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                                    title="Delete device"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer with count */}
                <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                    Showing {filteredDevices.length} of {devices.length} devices
                </div>
            </div>
        </Card>
    );
};

export default DevicesTable;
