import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Clock, Filter, Download, X, Calendar, ChevronDown } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { alertService } from '../../services/alertService';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AlertHistory = ({ triggeredAlerts = [], isLoading }) => {
    const [dateFilter, setDateFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const queryClient = useQueryClient();

    // Acknowledge alert mutation
    const acknowledgeMutation = useMutation({
        mutationFn: (id) => alertService.acknowledgeAlert(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['triggeredAlerts']);
            toast.success('Alert acknowledged');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to acknowledge alert');
        },
    });

    const handleAcknowledge = (alertId) => {
        acknowledgeMutation.mutate(alertId);
    };

    // Filter alerts based on date range and status
    const filterAlerts = () => {
        let filtered = [...triggeredAlerts];

        // Filter by status
        if (statusFilter === 'active') {
            filtered = filtered.filter(a => !a.acknowledged);
        } else if (statusFilter === 'acknowledged') {
            filtered = filtered.filter(a => a.acknowledged);
        }

        // Filter by date
        const now = new Date();
        if (dateFilter === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filtered = filtered.filter(a => new Date(a.triggeredAt) >= today);
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(a => new Date(a.triggeredAt) >= weekAgo);
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(a => new Date(a.triggeredAt) >= monthAgo);
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59);
            filtered = filtered.filter(a => {
                const date = new Date(a.triggeredAt);
                return date >= start && date <= end;
            });
        }

        return filtered;
    };

    const filteredAlerts = filterAlerts();

    // Export to CSV
    const handleExport = () => {
        const data = filteredAlerts.map(alert => ({
            'Alert Name': alert.alert?.name || 'Unknown',
            'Device': alert.device?.name || 'N/A',
            'Home': alert.home?.name || 'N/A',
            'Severity': alert.alert?.severity || 'medium',
            'Message': alert.message || '',
            'Triggered At': formatDateTime(alert.triggeredAt),
            'Status': alert.acknowledged ? 'Acknowledged' : 'Active',
            'Acknowledged At': alert.acknowledgedAt ? formatDateTime(alert.acknowledgedAt) : 'N/A',
        }));

        const headers = Object.keys(data[0] || {});
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `alert-history-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Alert history exported');
    };

    const getSeverityVariant = (severity) => {
        const variants = {
            low: 'primary',
            medium: 'warning',
            high: 'danger',
            critical: 'danger',
        };
        return variants[severity] || 'default';
    };

    if (isLoading) {
        return (
            <Card title="Alert History" subtitle="View and manage triggered alerts">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="Alert History"
            subtitle="View and manage triggered alerts"
            action={
                <div className="flex space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-1" />
                        Filters
                        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={filteredAlerts.length === 0}
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                    </Button>
                </div>
            }
        >
            {/* Filters Panel */}
            {showFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Date Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Range
                            </label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {/* Custom Date Range */}
                        {dateFilter === 'custom' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </>
                        )}

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Alerts</option>
                                <option value="active">Active Only</option>
                                <option value="acknowledged">Acknowledged Only</option>
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={() => {
                                setDateFilter('all');
                                setStatusFilter('all');
                                setCustomStartDate('');
                                setCustomEndDate('');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Results Summary */}
            <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                <span>
                    Showing {filteredAlerts.length} of {triggeredAlerts.length} alerts
                </span>
                <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                        <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span>
                        Active: {filteredAlerts.filter(a => !a.acknowledged).length}
                    </span>
                    <span className="flex items-center">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                        Acknowledged: {filteredAlerts.filter(a => a.acknowledged).length}
                    </span>
                </div>
            </div>

            {/* Alert List */}
            {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {triggeredAlerts.length > 0
                            ? 'Try adjusting your filters to see more alerts.'
                            : 'No alerts have been triggered yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredAlerts.map((alert) => (
                        <div
                            key={alert._id}
                            className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${alert.acknowledged
                                    ? 'bg-gray-50 border-gray-200'
                                    : 'bg-red-50 border-red-200'
                                }`}
                        >
                            {/* Icon */}
                            <div className={`p-2 rounded-full ${alert.acknowledged ? 'bg-gray-200' : 'bg-red-200'
                                }`}>
                                <Bell className={`h-5 w-5 ${alert.acknowledged ? 'text-gray-600' : 'text-red-600'
                                    }`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2">
                                    <p className="text-sm font-medium text-gray-900">
                                        {alert.alert?.name || 'Alert'}
                                    </p>
                                    <Badge variant={getSeverityVariant(alert.alert?.severity)} size="sm">
                                        {alert.alert?.severity || 'medium'}
                                    </Badge>
                                    {alert.acknowledged && (
                                        <Badge variant="success" size="sm">
                                            <Check className="h-3 w-3 mr-1" />
                                            Acknowledged
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-1 text-sm text-gray-600">
                                    {alert.device?.name && (
                                        <span>Device: {alert.device.name}</span>
                                    )}
                                    {alert.device?.name && alert.home?.name && <span> • </span>}
                                    {alert.home?.name && (
                                        <span>Home: {alert.home.name}</span>
                                    )}
                                </div>

                                {alert.message && (
                                    <p className="mt-2 text-sm text-gray-700">{alert.message}</p>
                                )}

                                <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                                    <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Triggered: {formatDateTime(alert.triggeredAt)}
                                    </span>
                                    {alert.acknowledgedAt && (
                                        <span className="flex items-center">
                                            <Check className="h-3 w-3 mr-1" />
                                            Acknowledged: {formatDateTime(alert.acknowledgedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {!alert.acknowledged && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAcknowledge(alert._id)}
                                    isLoading={acknowledgeMutation.isLoading}
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    Acknowledge
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default AlertHistory;
