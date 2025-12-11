import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit2,
    Trash2,
    Zap,
    Search,
    Filter,
    Power,
    PowerOff
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { adminService } from '../../services/adminService';
import { deviceService } from '../../services/deviceService';
import toast from 'react-hot-toast';

const DeviceTemplates = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        type: 'other',
        avgWattage: '',
        minWattage: '',
        maxWattage: '',
        category: 'other',
        description: '',
        avgUsageHoursPerDay: '',
        energyStarRated: false,
    });

    const queryClient = useQueryClient();

    // Fetch device templates
    const { data: templatesData, isLoading } = useQuery({
        queryKey: ['deviceTemplates'],
        queryFn: () => deviceService.getDeviceTemplates(),
    });

    const templates = templatesData?.data || templatesData?.templates || [];

    // Create template mutation
    const createMutation = useMutation({
        mutationFn: (data) => adminService.createDeviceTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['deviceTemplates']);
            toast.success('Template created successfully');
            closeModal();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create template');
        },
    });

    // Update template mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => adminService.updateDeviceTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['deviceTemplates']);
            toast.success('Template updated successfully');
            closeModal();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update template');
        },
    });

    // Delete template mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => adminService.deleteDeviceTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['deviceTemplates']);
            toast.success('Template deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete template');
        },
    });

    const deviceTypes = [
        'hvac', 'water_heater', 'refrigerator', 'washer', 'dryer',
        'dishwasher', 'oven', 'microwave', 'lighting', 'tv',
        'computer', 'gaming_console', 'ev_charger', 'pool_pump', 'other'
    ];

    const categories = [
        'heating_cooling', 'kitchen', 'laundry', 'entertainment', 'lighting', 'outdoor', 'other'
    ];

    const openCreateModal = () => {
        setEditingTemplate(null);
        setFormData({
            name: '',
            type: 'other',
            avgWattage: '',
            minWattage: '',
            maxWattage: '',
            category: 'other',
            description: '',
            avgUsageHoursPerDay: '',
            energyStarRated: false,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name || '',
            type: template.type || 'other',
            avgWattage: template.avgWattage || '',
            minWattage: template.minWattage || '',
            maxWattage: template.maxWattage || '',
            category: template.category || 'other',
            description: template.description || '',
            avgUsageHoursPerDay: template.avgUsageHoursPerDay || '',
            energyStarRated: template.energyStarRated || false,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            avgWattage: Number(formData.avgWattage),
            minWattage: formData.minWattage ? Number(formData.minWattage) : undefined,
            maxWattage: formData.maxWattage ? Number(formData.maxWattage) : undefined,
            avgUsageHoursPerDay: formData.avgUsageHoursPerDay ? Number(formData.avgUsageHoursPerDay) : undefined,
        };

        if (editingTemplate) {
            updateMutation.mutate({ id: editingTemplate._id, data: submitData });
        } else {
            createMutation.mutate(submitData);
        }
    };

    const handleDelete = (template) => {
        if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
            deleteMutation.mutate(template._id);
        }
    };

    // Filter templates
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const formatType = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    if (isLoading) {
        return (
            <DashboardLayout title="Device Templates">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Device Templates">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Device Templates</h2>
                        <p className="text-sm text-gray-600">Manage device templates for users</p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={Search}
                            />
                        </div>
                        <div className="sm:w-48">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {formatType(cat)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Templates Table */}
                <Card>
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12">
                            <Zap className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || categoryFilter !== 'all'
                                    ? 'Try adjusting your search or filter.'
                                    : 'Get started by creating a new device template.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Template
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Wattage
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTemplates.map((template) => (
                                        <tr key={template._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                                                        <Zap className="h-5 w-5 text-yellow-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {template.name}
                                                        </p>
                                                        {template.description && (
                                                            <p className="text-xs text-gray-500 truncate max-w-xs">
                                                                {template.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <Badge variant="primary" size="sm">
                                                    {formatType(template.type)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatType(template.category)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {template.avgWattage}W
                                                </div>
                                                {(template.minWattage || template.maxWattage) && (
                                                    <div className="text-xs text-gray-500">
                                                        {template.minWattage || 0} - {template.maxWattage || template.avgWattage}W
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {template.isActive !== false ? (
                                                        <Badge variant="success" size="sm">Active</Badge>
                                                    ) : (
                                                        <Badge variant="default" size="sm">Inactive</Badge>
                                                    )}
                                                    {template.energyStarRated && (
                                                        <Badge variant="primary" size="sm">Energy Star</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => openEditModal(template)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(template)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                            <p className="text-sm text-gray-600">Total Templates</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {templates.filter(t => t.isActive !== false).length}
                            </p>
                            <p className="text-sm text-gray-600">Active Templates</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {templates.filter(t => t.energyStarRated).length}
                            </p>
                            <p className="text-sm text-gray-600">Energy Star Rated</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {new Set(templates.map(t => t.category)).size}
                            </p>
                            <p className="text-sm text-gray-600">Categories</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingTemplate ? 'Edit Template' : 'Create New Template'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Template Name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Smart Refrigerator"
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Device Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                                required
                            >
                                {deviceTypes.map(type => (
                                    <option key={type} value={type}>
                                        {formatType(type)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {formatType(cat)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Avg Wattage"
                            type="number"
                            value={formData.avgWattage}
                            onChange={(e) => setFormData(prev => ({ ...prev, avgWattage: e.target.value }))}
                            placeholder="e.g., 150"
                            required
                        />
                        <Input
                            label="Min Wattage"
                            type="number"
                            value={formData.minWattage}
                            onChange={(e) => setFormData(prev => ({ ...prev, minWattage: e.target.value }))}
                            placeholder="e.g., 50"
                        />
                        <Input
                            label="Max Wattage"
                            type="number"
                            value={formData.maxWattage}
                            onChange={(e) => setFormData(prev => ({ ...prev, maxWattage: e.target.value }))}
                            placeholder="e.g., 300"
                        />
                    </div>

                    <Input
                        label="Avg Usage Hours/Day"
                        type="number"
                        step="0.5"
                        value={formData.avgUsageHoursPerDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, avgUsageHoursPerDay: e.target.value }))}
                        placeholder="e.g., 8"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                            placeholder="Brief description of this device template..."
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="energyStarRated"
                            checked={formData.energyStarRated}
                            onChange={(e) => setFormData(prev => ({ ...prev, energyStarRated: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <label htmlFor="energyStarRated" className="ml-2 text-sm text-gray-700">
                            Energy Star Rated
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button type="button" variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={createMutation.isLoading || updateMutation.isLoading}
                        >
                            {editingTemplate ? 'Update Template' : 'Create Template'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default DeviceTemplates;
