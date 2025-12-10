import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const ConsumptionChart = ({ data = [], isLoading = false }) => {
    const [chartData, setChartData] = useState([]);
    const [viewMode, setViewMode] = useState('total'); // 'total' or 'breakdown'
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        // Transform data for chart
        if (data && data.length > 0) {
            const transformed = data.map(item => ({
                time: new Date(item.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                total: item.total || 0,
                ...item.breakdown // Spread device breakdown data if available
            }));
            setChartData(transformed);
        }
    }, [data]);

    // Set up auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            // This would typically trigger a refetch of data
            // For now, it's a placeholder for integration with actual data fetching
            console.log('Auto-refreshing consumption data...');
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const handleManualRefresh = () => {
        console.log('Manual refresh triggered');
        // Trigger data refetch here
    };

    return (
        <Card>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Energy Consumption</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleManualRefresh}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Refresh data"
                        >
                            <RefreshCw className="h-4 w-4 text-gray-600" />
                        </button>
                        <label className="flex items-center space-x-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <span className="text-gray-600">Auto-refresh (30s)</span>
                        </label>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => setViewMode('total')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'total'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Home Total
                    </button>
                    <button
                        onClick={() => setViewMode('breakdown')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'breakdown'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Device Breakdown
                    </button>
                </div>

                {/* Chart */}
                {chartData.length === 0 ? (
                    <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No consumption data available</p>
                    </div>
                ) : (
                    <div className="w-full h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="time"
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    label={{ value: 'Watts (W)', angle: -90, position: 'insideLeft' }}
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}
                                    formatter={(value) => `${value.toFixed(2)}W`}
                                    labelStyle={{ color: '#000' }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="line"
                                />

                                {viewMode === 'total' ? (
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ fill: '#2563eb', r: 4 }}
                                        activeDot={{ r: 6 }}
                                        isAnimationActive={!isLoading}
                                        name="Total Consumption"
                                    />
                                ) : (
                                    // Render multiple lines for device breakdown
                                    chartData[0] &&
                                    Object.keys(chartData[0])
                                        .filter(key => key !== 'time' && key !== 'total')
                                        .map((device, idx) => (
                                            <Line
                                                key={device}
                                                type="monotone"
                                                dataKey={device}
                                                stroke={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 5 }}
                                                name={device}
                                                isAnimationActive={!isLoading}
                                            />
                                        ))
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Stats */}
                {chartData.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <p className="text-xs text-gray-600">Current</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {chartData[chartData.length - 1]?.total?.toFixed(2) || '0'}W
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Average</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {(chartData.reduce((sum, d) => sum + (d.total || 0), 0) / chartData.length).toFixed(2)}W
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Peak</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {Math.max(...chartData.map(d => d.total || 0)).toFixed(2)}W
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ConsumptionChart;
