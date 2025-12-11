import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, Plus, Settings } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import CreateAlertForm from '../components/alerts/CreateAlertForm';
import ActiveAlertsList from '../components/alerts/ActiveAlertsList';
import AlertHistory from '../components/alerts/AlertHistory';
import { alertService } from '../services/alertService';
import toast from 'react-hot-toast';

const Alerts = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);
    const [activeTab, setActiveTab] = useState('rules'); // 'rules' or 'history'
    const queryClient = useQueryClient();

    // Fetch user's alert rules
    const { data: alertsData, isLoading: alertsLoading } = useQuery({
        queryKey: ['userAlerts'],
        queryFn: () => alertService.getAlerts(),
    });

    // Fetch triggered alerts
    const { data: triggeredData, isLoading: triggeredLoading } = useQuery({
        queryKey: ['triggeredAlerts'],
        queryFn: () => alertService.getTriggeredAlerts(),
    });

    // Create alert mutation
    const createMutation = useMutation({
        mutationFn: (alertData) => alertService.createAlert(alertData),
        onSuccess: () => {
            queryClient.invalidateQueries(['userAlerts']);
            toast.success('Alert created successfully');
            setIsCreateModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create alert');
        },
    });

    // Update alert mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => alertService.updateAlert(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['userAlerts']);
            toast.success('Alert updated successfully');
            setEditingAlert(null);
            setIsCreateModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update alert');
        },
    });

    const handleCreateOrUpdate = (alertData, alertId) => {
        if (alertId) {
            updateMutation.mutate({ id: alertId, data: alertData });
        } else {
            createMutation.mutate(alertData);
        }
    };

    const handleEdit = (alert) => {
        setEditingAlert(alert);
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setEditingAlert(null);
    };

    const alerts = alertsData?.alerts || [];
    const triggeredAlerts = triggeredData?.triggeredAlerts || triggeredData?.data || [];
    const activeAlerts = triggeredAlerts.filter(a => !a.acknowledged);

    if (alertsLoading && triggeredLoading) {
        return (
            <DashboardLayout title="Alerts">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Alerts">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Alert Management</h2>
                        <p className="text-sm text-gray-600">Create and manage energy usage alerts</p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Alert
                    </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Settings className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Alert Rules</p>
                                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Bell className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Rules</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {alerts.filter(a => a.isEnabled).length}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Unacknowledged</p>
                                <p className="text-2xl font-bold text-gray-900">{activeAlerts.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Bell className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Triggered</p>
                                <p className="text-2xl font-bold text-gray-900">{triggeredAlerts.length}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rules'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Settings className="h-4 w-4 inline mr-2" />
                            Alert Rules
                            <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                {alerts.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Bell className="h-4 w-4 inline mr-2" />
                            Alert History
                            {activeAlerts.length > 0 && (
                                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                                    {activeAlerts.length} new
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'rules' ? (
                    <ActiveAlertsList
                        alerts={alerts}
                        onEdit={handleEdit}
                        isLoading={alertsLoading}
                    />
                ) : (
                    <AlertHistory
                        triggeredAlerts={triggeredAlerts}
                        isLoading={triggeredLoading}
                    />
                )}

                {/* Create/Edit Alert Modal */}
                <CreateAlertForm
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleCreateOrUpdate}
                    editingAlert={editingAlert}
                />
            </div>
        </DashboardLayout>
    );
};

export default Alerts;
