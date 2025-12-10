import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowLeft, Calendar, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { deviceService } from '../services/deviceService';
import { formatCurrency, formatEnergy } from '../utils/helpers';

const DeviceDetail = () => {
    const { deviceId } = useParams();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('7'); // 7 or 30 days

    const { data, isLoading, error } = useQuery({
        queryKey: ['device', deviceId, timeRange],
        queryFn: () => deviceService.getDeviceDetail(deviceId, { days: parseInt(timeRange) }),
        enabled: !!deviceId,
    });

    if (isLoading) {
        return (
            <DashboardLayout title="Device Details">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data?.data) {
        return (
            <DashboardLayout title="Device Details">
                <Card>
                    <div className="text-center py-12">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Device not found</h3>
                        <p className="text-gray-600 mb-6">The device you're looking for doesn't exist or has been deleted.</p>
                        <Button onClick={() => navigate('/devices')}>Back to Devices</Button>
                    </div>
                </Card>
            </DashboardLayout>
        );
    }

    const device = data.data;
    const consumptionData = device.consumptionHistory || [];
    const dailyData = device.dailyBreakdown || [];

    return (
        <DashboardLayout title={device.name}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/devices')}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Back to Devices</span>
                    </button>
                </div>

                {/* Device Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Basic Info */}
                    <Card>
                        <div className="text-center">
                            <Lightbulb className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                            <h3 className="font-semibold text-gray-900 mb-2">{device.name}</h3>
                            <p className="text-sm text-gray-600">{device.location}</p>
                            <div className="mt-4 flex justify-center">
                                <Badge variant={device.isActive ? 'success' : 'secondary'}>
                                    {device.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Category & Wattage */}
                    <Card>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Category</p>
                            <p className="text-lg font-bold text-gray-900 mb-4">
                                {device.category || 'N/A'}
                            </p>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Rated Wattage</p>
                            <p className="text-lg font-bold text-blue-600">{device.wattage}W</p>
                        </div>
                    </Card>

                    {/* Today's Usage */}
                    <Card>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Today's Usage</p>
                            <p className="text-2xl font-bold text-green-600 mb-2">
                                {formatEnergy(device.todayConsumption || 0)}
                            </p>
                            <p className="text-xs text-gray-600">
                                {device.todayHours || 0} hours active
                            </p>
                        </div>
                    </Card>

                    {/* Average Daily Cost */}
                    <Card>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Avg Daily Cost</p>
                            <p className="text-2xl font-bold text-orange-600 mb-2">
                                {formatCurrency(device.averageDailyCost || 0)}
                            </p>
                            <p className="text-xs text-gray-600">
                                Based on last {timeRange} days
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Consumption History */}
                    <Card title="Consumption History">
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                {['7', '30'].map(days => (
                                    <button
                                        key={days}
                                        onClick={() => setTimeRange(days)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === days
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {days} Days
                                    </button>
                                ))}
                            </div>

                            <div className="w-full h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={consumptionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#6b7280"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#6b7280"
                                            label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px'
                                            }}
                                            formatter={(value) => `${value.toFixed(3)}kWh`}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="consumption"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                            dot={{ fill: '#2563eb', r: 4 }}
                                            name="Consumption"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    {/* Daily Breakdown */}
                    <Card title="Daily Usage Pattern">
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value) => `${value.toFixed(1)}h`}
                                    />
                                    <Bar
                                        dataKey="hoursActive"
                                        fill="#10b981"
                                        name="Hours Active"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Efficiency Rating */}
                    <Card>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900">Efficiency Rating</h4>
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="text-center mb-4">
                                <p className="text-4xl font-bold text-green-600">
                                    {device.efficiencyRating || 85}%
                                </p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-xs text-green-700">
                                Good efficiency. Keep monitoring usage patterns.
                            </div>
                        </div>
                    </Card>

                    {/* Savings Tips */}
                    <Card>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Saving Tips</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Usage peaks in evening hours</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Consider scheduling during off-peak hours</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Potential savings: $5-10/month</span>
                                </li>
                            </ul>
                        </div>
                    </Card>

                    {/* Cost Analysis */}
                    <Card>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Cost Analysis</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">This Week:</span>
                                    <span className="font-medium">{formatCurrency(device.weekCost || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">This Month:</span>
                                    <span className="font-medium">{formatCurrency(device.monthCost || 0)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 mt-2">
                                    <div className="flex justify-between font-semibold">
                                        <span>Yearly Estimate:</span>
                                        <span className="text-orange-600">{formatCurrency(device.yearlyCostEstimate || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DeviceDetail;
