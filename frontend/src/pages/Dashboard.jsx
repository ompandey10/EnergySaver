import { useQuery } from '@tanstack/react-query';
import {
    Zap,
    Home,
    TrendingUp,
    DollarSign,
    Activity,
    AlertTriangle
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { homeService } from '../services/homeService';
import { deviceService } from '../services/deviceService';
import { alertService } from '../services/alertService';
import { formatCurrency, formatEnergy } from '../utils/helpers';

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        yellow: 'bg-yellow-100 text-yellow-600',
    };

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {trend && (
                        <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-full ${colors[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </Card>
    );
};

const Dashboard = () => {
    const { data: homesData, isLoading: homesLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: homeService.getHomes,
    });

    const { data: alertsData, isLoading: alertsLoading } = useQuery({
        queryKey: ['triggeredAlerts'],
        queryFn: () => alertService.getTriggeredAlerts({ limit: 5 }),
    });

    const isLoading = homesLoading || alertsLoading;

    if (isLoading) {
        return (
            <DashboardLayout title="Dashboard">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    const homes = homesData?.data || [];
    const alerts = alertsData?.data || [];

    // Calculate stats
    const totalDevices = homes.reduce((sum, home) => sum + (home.devices?.length || 0), 0);
    const totalConsumption = homes.reduce((sum, home) => sum + (home.totalConsumption || 0), 0);
    const totalCost = homes.reduce((sum, home) => sum + (home.totalCost || 0), 0);
    const activeAlerts = alerts.filter(a => !a.acknowledged).length;

    return (
        <DashboardLayout title="Dashboard">
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Homes"
                        value={homes.length}
                        icon={Home}
                        color="blue"
                    />
                    <StatCard
                        title="Active Devices"
                        value={totalDevices}
                        icon={Zap}
                        color="green"
                    />
                    <StatCard
                        title="Energy Consumption"
                        value={formatEnergy(totalConsumption)}
                        icon={Activity}
                        trend={-5.2}
                        color="blue"
                    />
                    <StatCard
                        title="Total Cost"
                        value={formatCurrency(totalCost)}
                        icon={DollarSign}
                        trend={-3.1}
                        color="green"
                    />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Alerts */}
                    <Card title="Recent Alerts" subtitle="Latest triggered alerts">
                        {alerts.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No recent alerts</p>
                        ) : (
                            <div className="space-y-3">
                                {alerts.slice(0, 5).map((alert) => (
                                    <div
                                        key={alert._id}
                                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {alert.alert?.name || 'Alert'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {alert.device?.name || 'Unknown Device'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(alert.triggeredAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!alert.acknowledged && (
                                            <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Homes Overview */}
                    <Card title="Your Homes" subtitle="Overview of registered homes">
                        {homes.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No homes registered</p>
                        ) : (
                            <div className="space-y-3">
                                {homes.slice(0, 5).map((home) => (
                                    <div
                                        key={home._id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{home.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {home.devices?.length || 0} devices • {home.city}, {home.state}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatEnergy(home.totalConsumption || 0)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatCurrency(home.totalCost || 0)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
