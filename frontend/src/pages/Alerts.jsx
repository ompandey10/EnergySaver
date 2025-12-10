import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, Plus } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { alertService } from '../services/alertService';
import { formatDateTime, getAlertColor } from '../utils/helpers';

const Alerts = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['triggeredAlerts'],
        queryFn: () => alertService.getTriggeredAlerts(),
    });

    if (isLoading) {
        return (
            <DashboardLayout title="Alerts">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    const alerts = data?.data || [];
    const activeAlerts = alerts.filter(a => !a.acknowledged);
    const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

    return (
        <DashboardLayout title="Alerts">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Alert Management</h2>
                        <p className="text-sm text-gray-600">Monitor and manage your alerts</p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Alert
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Alerts</p>
                                <p className="text-2xl font-bold text-gray-900">{activeAlerts.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Bell className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Acknowledged</p>
                                <p className="text-2xl font-bold text-gray-900">{acknowledgedAlerts.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Bell className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Alerts</p>
                                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Active Alerts */}
                {activeAlerts.length > 0 && (
                    <Card title="Active Alerts" subtitle="Alerts requiring attention">
                        <div className="space-y-3">
                            {activeAlerts.map((alert) => (
                                <div
                                    key={alert._id}
                                    className="flex items-start space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                                >
                                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-gray-900">
                                                {alert.alert?.name || 'Alert'}
                                            </p>
                                            <Badge variant="danger">{alert.alert?.severity || 'medium'}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Device: {alert.device?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDateTime(alert.triggeredAt)}
                                        </p>
                                        {alert.message && (
                                            <p className="text-sm text-gray-700 mt-2">{alert.message}</p>
                                        )}
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Acknowledge
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Alert History */}
                <Card title="Alert History" subtitle="Previously triggered alerts">
                    {alerts.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
                            <p className="mt-1 text-sm text-gray-500">No alerts have been triggered yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.slice(0, 10).map((alert) => (
                                <div
                                    key={alert._id}
                                    className={`flex items-start space-x-4 p-4 rounded-lg border ${alert.acknowledged
                                            ? 'bg-gray-50 border-gray-200'
                                            : 'bg-yellow-50 border-yellow-200'
                                        }`}
                                >
                                    <Bell className={`h-5 w-5 flex-shrink-0 mt-0.5 ${alert.acknowledged ? 'text-gray-400' : 'text-yellow-600'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-gray-900">
                                                {alert.alert?.name || 'Alert'}
                                            </p>
                                            <Badge variant={alert.acknowledged ? 'default' : 'warning'}>
                                                {alert.alert?.severity || 'medium'}
                                            </Badge>
                                            {alert.acknowledged && (
                                                <Badge variant="success">Acknowledged</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Device: {alert.device?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDateTime(alert.triggeredAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Alerts;
