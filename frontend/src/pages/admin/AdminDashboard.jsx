import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Home,
    Zap,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    BarChart3,
    PieChart
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { adminService } from '../../services/adminService';
import { formatNumber, formatEnergy, formatCurrency } from '../../utils/helpers';

const AdminDashboard = () => {
    // Fetch platform stats
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['platformStats'],
        queryFn: () => adminService.getPlatformStats(),
    });

    const stats = statsData?.data || {
        totalUsers: 0,
        totalHomes: 0,
        totalDevices: 0,
        totalReadings: 0,
        totalKWh: 0,
        totalCost: 0,
        newUsersThisMonth: 0,
        activeUsers: 0,
    };

    // Mock data for charts (would come from API)
    const monthlyData = [
        { month: 'Jul', users: 120, energy: 45000, revenue: 5400 },
        { month: 'Aug', users: 145, energy: 52000, revenue: 6240 },
        { month: 'Sep', users: 168, energy: 48000, revenue: 5760 },
        { month: 'Oct', users: 195, energy: 43000, revenue: 5160 },
        { month: 'Nov', users: 220, energy: 51000, revenue: 6120 },
        { month: 'Dec', users: 250, energy: 58000, revenue: 6960 },
    ];

    const maxUsers = Math.max(...monthlyData.map(m => m.users));
    const maxEnergy = Math.max(...monthlyData.map(m => m.energy));

    if (isLoading) {
        return (
            <DashboardLayout title="Admin Dashboard">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Admin Dashboard">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
                    <p className="text-sm text-gray-600">Monitor platform metrics and performance</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatNumber(stats.totalUsers, 0)}
                                </p>
                                {stats.newUsersThisMonth > 0 && (
                                    <p className="text-xs text-green-600 flex items-center">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        +{stats.newUsersThisMonth} this month
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Home className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Homes</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatNumber(stats.totalHomes, 0)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <Zap className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Devices</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatNumber(stats.totalDevices, 0)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Activity className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatNumber(stats.activeUsers, 0)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Energy & Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Total Energy Tracked</h3>
                                <p className="text-3xl font-bold text-blue-600 mt-2">
                                    {formatEnergy(stats.totalKWh || 0)}
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <Zap className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <Activity className="h-4 w-4 mr-1" />
                            {formatNumber(stats.totalReadings || 0, 0)} total readings
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Total Cost Calculated</h3>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {formatCurrency(stats.totalCost || 0)}
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Average ${formatNumber((stats.totalCost || 0) / Math.max(stats.totalHomes || 1, 1), 2)}/home
                        </div>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Growth Chart */}
                    <Card title="User Growth" subtitle="Monthly new user registrations">
                        <div className="flex items-end justify-between space-x-2 h-48">
                            {monthlyData.map((month, index) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div className="w-full flex justify-center">
                                        <div
                                            className="w-10 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                                            style={{ height: `${(month.users / maxUsers) * 160}px` }}
                                            title={`${month.users} users`}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                                    <span className="text-xs font-medium text-gray-700">{month.users}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Energy Usage Chart */}
                    <Card title="Energy Tracked" subtitle="Monthly energy consumption data">
                        <div className="flex items-end justify-between space-x-2 h-48">
                            {monthlyData.map((month, index) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div className="w-full flex justify-center">
                                        <div
                                            className="w-10 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer"
                                            style={{ height: `${(month.energy / maxEnergy) * 160}px` }}
                                            title={`${formatEnergy(month.energy)}`}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                                    <span className="text-xs font-medium text-gray-700">{(month.energy / 1000).toFixed(0)}k</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Recent Activity & Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Stats */}
                    <Card title="Platform Metrics" subtitle="Key performance indicators">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Avg. Devices/Home</span>
                                <span className="font-medium">
                                    {formatNumber((stats.totalDevices || 0) / Math.max(stats.totalHomes || 1, 1), 1)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Avg. kWh/User</span>
                                <span className="font-medium">
                                    {formatNumber((stats.totalKWh || 0) / Math.max(stats.totalUsers || 1, 1), 1)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">User Activation Rate</span>
                                <span className="font-medium">
                                    {formatNumber(((stats.activeUsers || 0) / Math.max(stats.totalUsers || 1, 1)) * 100, 1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Readings/Device</span>
                                <span className="font-medium">
                                    {formatNumber((stats.totalReadings || 0) / Math.max(stats.totalDevices || 1, 1), 0)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Top Device Types */}
                    <Card title="Popular Device Types" subtitle="Most tracked devices">
                        <div className="space-y-3">
                            {[
                                { type: 'HVAC', count: 450, color: 'bg-blue-500' },
                                { type: 'Refrigerator', count: 380, color: 'bg-green-500' },
                                { type: 'Washer/Dryer', count: 320, color: 'bg-yellow-500' },
                                { type: 'Lighting', count: 280, color: 'bg-purple-500' },
                                { type: 'TV/Entertainment', count: 210, color: 'bg-pink-500' },
                            ].map((device, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`h-3 w-3 rounded-full ${device.color} mr-2`}></div>
                                        <span className="text-sm text-gray-700">{device.type}</span>
                                    </div>
                                    <Badge variant="default" size="sm">{device.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Recent Users */}
                    <Card title="Recent Sign-ups" subtitle="Latest user registrations">
                        <div className="space-y-3">
                            {[
                                { name: 'John D.', time: '2 hours ago', homes: 1 },
                                { name: 'Sarah M.', time: '5 hours ago', homes: 2 },
                                { name: 'Mike R.', time: '1 day ago', homes: 1 },
                                { name: 'Emily K.', time: '2 days ago', homes: 1 },
                                { name: 'David L.', time: '3 days ago', homes: 3 },
                            ].map((user, index) => (
                                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.time}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">{user.homes} home(s)</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
