import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Zap,
    MapPin,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Home,
    Search
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { adminService } from '../../services/adminService';
import { formatEnergy, formatNumber, formatCurrency } from '../../utils/helpers';

const CommunityInsights = () => {
    const [zipCodeFilter, setZipCodeFilter] = useState('');
    const [selectedZipCode, setSelectedZipCode] = useState('');

    // Fetch community insights
    const { data: insightsData, isLoading } = useQuery({
        queryKey: ['communityInsights', selectedZipCode],
        queryFn: () => adminService.getCommunityInsights({ zipCode: selectedZipCode }),
    });

    const insights = insightsData?.data || {};

    // Mock data for visualization (would come from API)
    const zipCodeData = [
        { zipCode: '10001', homes: 45, avgUsage: 850, avgCost: 102 },
        { zipCode: '10002', homes: 62, avgUsage: 920, avgCost: 110 },
        { zipCode: '10003', homes: 38, avgUsage: 780, avgCost: 94 },
        { zipCode: '10004', homes: 51, avgUsage: 890, avgCost: 107 },
        { zipCode: '10005', homes: 29, avgUsage: 750, avgCost: 90 },
    ];

    const deviceTypeStats = [
        { type: 'HVAC', percentage: 35, avgUsage: 450 },
        { type: 'Water Heater', percentage: 18, avgUsage: 230 },
        { type: 'Refrigerator', percentage: 15, avgUsage: 190 },
        { type: 'Washer/Dryer', percentage: 12, avgUsage: 150 },
        { type: 'Lighting', percentage: 10, avgUsage: 130 },
        { type: 'Other', percentage: 10, avgUsage: 130 },
    ];

    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-400'];

    const handleSearch = () => {
        setSelectedZipCode(zipCodeFilter);
    };

    if (isLoading) {
        return (
            <DashboardLayout title="Community Insights">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Community Insights">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Community Insights</h2>
                    <p className="text-sm text-gray-600">
                        Aggregated energy consumption data across the platform
                    </p>
                </div>

                {/* ZIP Code Search */}
                <Card>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Filter by ZIP code..."
                                value={zipCodeFilter}
                                onChange={(e) => setZipCodeFilter(e.target.value)}
                                icon={MapPin}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </button>
                        {selectedZipCode && (
                            <button
                                onClick={() => {
                                    setZipCodeFilter('');
                                    setSelectedZipCode('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    {selectedZipCode && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center">
                            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="text-sm text-blue-800">
                                Showing insights for ZIP code: <strong>{selectedZipCode}</strong>
                            </span>
                        </div>
                    )}
                </Card>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Home className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Homes</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {insights.totalHomes || 225}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Zap className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Avg Monthly Usage</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatNumber(insights.avgMonthlyUsage || 856, 0)} kWh
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <TrendingUp className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Avg Monthly Cost</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(insights.avgMonthlyCost || 102.72)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <MapPin className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">ZIP Codes</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {insights.uniqueZipCodes || 12}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Device Type Breakdown */}
                    <Card title="Popular Device Types" subtitle="Energy consumption by device category">
                        <div className="space-y-4">
                            {deviceTypeStats.map((device, index) => (
                                <div key={device.type} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <div className={`h-3 w-3 rounded-full ${colors[index]} mr-2`}></div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {device.type}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {device.percentage}% • {device.avgUsage} kWh avg
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${colors[index]}`}
                                            style={{ width: `${device.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pie Chart Visual */}
                        <div className="mt-6 flex justify-center">
                            <div className="relative h-40 w-40">
                                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                    {deviceTypeStats.reduce((acc, device, index) => {
                                        const startAngle = acc.offset;
                                        const angle = (device.percentage / 100) * 360;
                                        const endAngle = startAngle + angle;

                                        const startRad = (startAngle * Math.PI) / 180;
                                        const endRad = (endAngle * Math.PI) / 180;

                                        const x1 = 50 + 40 * Math.cos(startRad);
                                        const y1 = 50 + 40 * Math.sin(startRad);
                                        const x2 = 50 + 40 * Math.cos(endRad);
                                        const y2 = 50 + 40 * Math.sin(endRad);

                                        const largeArc = angle > 180 ? 1 : 0;

                                        const colorClasses = {
                                            'bg-blue-500': '#3b82f6',
                                            'bg-green-500': '#22c55e',
                                            'bg-yellow-500': '#eab308',
                                            'bg-purple-500': '#a855f7',
                                            'bg-pink-500': '#ec4899',
                                            'bg-gray-400': '#9ca3af',
                                        };

                                        acc.paths.push(
                                            <path
                                                key={index}
                                                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                                fill={colorClasses[colors[index]]}
                                            />
                                        );
                                        acc.offset = endAngle;
                                        return acc;
                                    }, { paths: [], offset: 0 }).paths}
                                </svg>
                            </div>
                        </div>
                    </Card>

                    {/* Usage by ZIP Code */}
                    <Card title="Average Usage by ZIP Code" subtitle="Top areas by energy consumption">
                        <div className="space-y-4">
                            {zipCodeData.map((area, index) => {
                                const maxUsage = Math.max(...zipCodeData.map(z => z.avgUsage));
                                const percentage = (area.avgUsage / maxUsage) * 100;

                                return (
                                    <div key={area.zipCode} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {area.zipCode}
                                                </span>
                                                <Badge variant="default" size="sm" className="ml-2">
                                                    {area.homes} homes
                                                </Badge>
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                {area.avgUsage} kWh/mo
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-blue-500"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Consumption Distribution */}
                <Card title="Consumption Distribution" subtitle="How homes are distributed by usage">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {[
                            { range: '0-500', count: 45, label: 'Low' },
                            { range: '500-750', count: 72, label: 'Below Avg' },
                            { range: '750-1000', count: 58, label: 'Average' },
                            { range: '1000-1500', count: 35, label: 'Above Avg' },
                            { range: '1500+', count: 15, label: 'High' },
                        ].map((bucket, index) => (
                            <div
                                key={bucket.range}
                                className="p-4 bg-gray-50 rounded-lg text-center"
                            >
                                <div
                                    className="mx-auto mb-2 rounded-lg flex items-end justify-center"
                                    style={{ height: '80px' }}
                                >
                                    <div
                                        className={`w-12 rounded-t ${index === 0 ? 'bg-green-400' :
                                                index === 1 ? 'bg-green-500' :
                                                    index === 2 ? 'bg-yellow-500' :
                                                        index === 3 ? 'bg-orange-500' :
                                                            'bg-red-500'
                                            }`}
                                        style={{ height: `${(bucket.count / 72) * 80}px` }}
                                    ></div>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{bucket.count} homes</p>
                                <p className="text-xs text-gray-500">{bucket.range} kWh</p>
                                <Badge
                                    variant={
                                        index === 0 ? 'success' :
                                            index === 1 ? 'success' :
                                                index === 2 ? 'warning' :
                                                    index === 3 ? 'warning' :
                                                        'danger'
                                    }
                                    size="sm"
                                    className="mt-1"
                                >
                                    {bucket.label}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Insights & Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Key Insights" subtitle="Notable patterns and trends">
                        <div className="space-y-4">
                            <div className="flex items-start p-3 bg-green-50 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        Overall Usage Down 8%
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        Compared to last month, platform-wide energy consumption decreased
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                                <Zap className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">
                                        HVAC Peak Usage
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        HVAC systems account for 35% of total energy tracked
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                                <Users className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">
                                        High Engagement
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        78% of users have logged usage in the past 7 days
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Top Efficiency Tips" subtitle="Most impactful recommendations">
                        <div className="space-y-3">
                            {[
                                { tip: 'Upgrade to LED lighting', savings: '$120/year', adoptionRate: 65 },
                                { tip: 'Smart thermostat installation', savings: '$180/year', adoptionRate: 42 },
                                { tip: 'Regular HVAC maintenance', savings: '$150/year', adoptionRate: 38 },
                                { tip: 'Energy-efficient appliances', savings: '$200/year', adoptionRate: 28 },
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{item.tip}</p>
                                        <p className="text-xs text-green-600">Potential: {item.savings}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{item.adoptionRate}%</p>
                                        <p className="text-xs text-gray-500">adoption</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CommunityInsights;
