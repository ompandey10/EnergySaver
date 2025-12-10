import { useState } from 'react';
import { AlertTriangle, Bell, Check, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';

const getAlertColor = (severity) => {
    const colors = {
        critical: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200',
    };
    return colors[severity] || 'bg-gray-50 border-gray-200';
};

const getAlertIcon = (severity) => {
    const icons = {
        critical: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600',
    };
    return icons[severity] || 'text-gray-600';
};

const AlertsPanel = ({ alerts = [], onMarkAsRead, onDismiss, onViewAll }) => {
    const navigate = useNavigate();
    const [dismissedIds, setDismissedIds] = useState([]);

    const activeAlerts = alerts.filter(alert => !dismissedIds.includes(alert._id));
    const unreadAlerts = activeAlerts.filter(alert => !alert.acknowledged);

    const handleMarkAsRead = (alertId) => {
        onMarkAsRead?.(alertId);
    };

    const handleDismiss = (alertId) => {
        setDismissedIds([...dismissedIds, alertId]);
        onDismiss?.(alertId);
    };

    const handleNavigateToAlert = (alertId) => {
        navigate(`/alerts/${alertId}`);
    };

    return (
        <Card>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
                        {unreadAlerts.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {unreadAlerts.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => onViewAll?.()}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                    >
                        <span>View All</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Alerts List */}
                {activeAlerts.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium mb-1">No active alerts</p>
                        <p className="text-sm text-gray-400">All systems are operating normally</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeAlerts.slice(0, 5).map((alert) => (
                            <div
                                key={alert._id}
                                className={`p-4 rounded-lg border-l-4 transition-all ${getAlertColor(alert.severity)} ${alert.acknowledged ? 'opacity-75' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${getAlertIcon(alert.severity)}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className="text-sm font-semibold text-gray-900">
                                                    {alert.name || alert.alert?.name || 'Alert'}
                                                </h4>
                                                <Badge
                                                    variant={
                                                        alert.severity === 'critical'
                                                            ? 'destructive'
                                                            : alert.severity === 'warning'
                                                                ? 'warning'
                                                                : 'default'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {alert.severity || 'info'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-1">
                                                {alert.device?.name || 'Unknown Device'}
                                            </p>
                                            <p className="text-xs text-gray-700 mb-2">
                                                {alert.message || alert.description || 'Alert triggered'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(alert.triggeredAt || alert.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                                        {!alert.acknowledged && (
                                            <button
                                                onClick={() => handleMarkAsRead(alert._id)}
                                                className="p-2 hover:bg-white/50 rounded transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4 text-green-600" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleNavigateToAlert(alert._id)}
                                            className="p-2 hover:bg-white/50 rounded transition-colors"
                                            title="View details"
                                        >
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDismiss(alert._id)}
                                            className="p-2 hover:bg-white/50 rounded transition-colors"
                                            title="Dismiss alert"
                                        >
                                            <X className="h-4 w-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                {activeAlerts.length > 5 && (
                    <div className="pt-4 border-t border-gray-200 text-center">
                        <button
                            onClick={() => onViewAll?.()}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View all {activeAlerts.length} alerts
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default AlertsPanel;
