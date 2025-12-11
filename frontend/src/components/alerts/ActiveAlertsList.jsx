import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, Power, PowerOff, AlertTriangle, Home, Lightbulb } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { alertService } from '../../services/alertService';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ActiveAlertsList = ({ alerts = [], onEdit, isLoading }) => {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [alertToDelete, setAlertToDelete] = useState(null);
    const queryClient = useQueryClient();

    // Toggle alert mutation
    const toggleMutation = useMutation({
        mutationFn: ({ id, isEnabled }) => alertService.toggleAlert(id, isEnabled),
        onSuccess: () => {
            queryClient.invalidateQueries(['userAlerts']);
            toast.success('Alert status updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update alert');
        },
    });

    // Delete alert mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => alertService.deleteAlert(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['userAlerts']);
            toast.success('Alert deleted successfully');
            setDeleteModalOpen(false);
            setAlertToDelete(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete alert');
        },
    });

    const handleToggle = (alert) => {
        toggleMutation.mutate({ id: alert._id, isEnabled: !alert.isEnabled });
    };

    const handleDeleteClick = (alert) => {
        setAlertToDelete(alert);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (alertToDelete) {
            deleteMutation.mutate(alertToDelete._id);
        }
    };

    const getAlertTypeLabel = (type) => {
        const labels = {
            usage_limit: 'Usage Limit',
            cost_limit: 'Cost Limit',
            unusual_activity: 'Unusual Activity',
            device_offline: 'Device Offline',
        };
        return labels[type] || type;
    };

    const getPeriodLabel = (period) => {
        const labels = {
            hourly: 'Hourly',
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
        };
        return labels[period] || period;
    };

    const getAlertLimit = (alert) => {
        if (alert.type === 'usage_limit' && alert.limitKWh) {
            return `${alert.limitKWh} kWh`;
        }
        if (alert.type === 'cost_limit' && alert.limitCost) {
            return `$${alert.limitCost.toFixed(2)}`;
        }
        return '-';
    };

    if (isLoading) {
        return (
            <Card title="Alert Rules" subtitle="Manage your active alert rules">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card title="Alert Rules" subtitle="Manage your active alert rules">
                {alerts.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No alert rules</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Create your first alert rule to start monitoring energy usage.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Alert
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Scope
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Limit
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Triggered
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {alerts.map((alert) => (
                                    <tr key={alert._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`p-2 rounded-lg ${alert.isEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                    <AlertTriangle className={`h-5 w-5 ${alert.isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{alert.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Threshold: {alert.threshold}%
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-600">
                                                {alert.device ? (
                                                    <>
                                                        <Lightbulb className="h-4 w-4 mr-1 text-yellow-500" />
                                                        {alert.device?.name || 'Device'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Home className="h-4 w-4 mr-1 text-blue-500" />
                                                        {alert.home?.name || 'Home'}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <Badge variant="primary" size="sm">
                                                {getAlertTypeLabel(alert.type)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {getAlertLimit(alert)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {getPeriodLabel(alert.period)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <Badge variant={alert.isEnabled ? 'success' : 'default'} size="sm">
                                                {alert.isEnabled ? 'Active' : 'Disabled'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {alert.triggerCount > 0 ? (
                                                <span className="text-orange-600">
                                                    {alert.triggerCount}x
                                                    {alert.lastTriggered && (
                                                        <span className="block text-xs text-gray-400">
                                                            Last: {formatDateTime(alert.lastTriggered)}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Never</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleToggle(alert)}
                                                    className={`p-2 rounded-lg transition-colors ${alert.isEnabled
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                    title={alert.isEnabled ? 'Disable alert' : 'Enable alert'}
                                                    disabled={toggleMutation.isLoading}
                                                >
                                                    {alert.isEnabled ? (
                                                        <Power className="h-5 w-5" />
                                                    ) : (
                                                        <PowerOff className="h-5 w-5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => onEdit(alert)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit alert"
                                                >
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(alert)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete alert"
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Alert"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete the alert "{alertToDelete?.name}"? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteConfirm}
                            isLoading={deleteMutation.isLoading}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ActiveAlertsList;
