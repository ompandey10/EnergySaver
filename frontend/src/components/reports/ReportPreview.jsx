import { TrendingUp, TrendingDown, DollarSign, Zap, Lightbulb, Home } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatCurrency, formatEnergy, formatNumber } from '../../utils/helpers';

const ReportPreview = ({ reportData }) => {
    if (!reportData) {
        return (
            <Card title="Report Preview" subtitle="Generate a report to see the preview">
                <div className="text-center py-12">
                    <Zap className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No report data</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Select a home and generate a report to see detailed analytics.
                    </p>
                </div>
            </Card>
        );
    }

    const {
        summary = {},
        deviceBreakdown = [],
        dailyConsumption = [],
        costAnalysis = {},
        tips = [],
        homeName,
        month,
        year,
    } = reportData;

    const totalConsumption = summary.totalKWh || 0;
    const totalCost = summary.totalCost || costAnalysis.totalCost || 0;
    const avgDaily = summary.avgDaily || totalConsumption / 30;
    const previousMonth = summary.previousMonth || {};
    const percentChange = previousMonth.totalKWh
        ? ((totalConsumption - previousMonth.totalKWh) / previousMonth.totalKWh) * 100
        : 0;

    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    return (
        <div className="space-y-6">
            {/* Report Header */}
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Energy Report - {months[month]} {year}
                        </h2>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Home className="h-4 w-4 mr-1" />
                            {homeName || 'Your Home'}
                        </p>
                    </div>
                    <Badge variant={percentChange <= 0 ? 'success' : 'danger'} size="lg">
                        {percentChange <= 0 ? (
                            <TrendingDown className="h-4 w-4 mr-1" />
                        ) : (
                            <TrendingUp className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(percentChange).toFixed(1)}% vs last month
                    </Badge>
                </div>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Zap className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Consumption</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatEnergy(totalConsumption)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-full">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Cost</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(totalCost)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg. Daily Usage</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatNumber(avgDaily, 2)} kWh
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-orange-100 rounded-full">
                            <Lightbulb className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Devices</p>
                            <p className="text-xl font-bold text-gray-900">
                                {deviceBreakdown.length || summary.deviceCount || 0}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Device Breakdown */}
            {deviceBreakdown.length > 0 && (
                <Card title="Device Consumption Breakdown" subtitle="Energy usage by device">
                    <div className="space-y-4">
                        {deviceBreakdown.map((device, index) => {
                            const percentage = (device.kWh / totalConsumption) * 100 || 0;
                            const colors = [
                                'bg-blue-500',
                                'bg-green-500',
                                'bg-yellow-500',
                                'bg-purple-500',
                                'bg-pink-500',
                                'bg-indigo-500',
                                'bg-red-500',
                                'bg-orange-500',
                            ];
                            return (
                                <div key={device._id || index}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">
                                            {device.name || device.deviceName}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {formatEnergy(device.kWh)} ({percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${colors[index % colors.length]}`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Cost Analysis */}
            {costAnalysis && Object.keys(costAnalysis).length > 0 && (
                <Card title="Cost Analysis" subtitle="Detailed cost breakdown">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Base Cost</span>
                                <span className="font-medium">{formatCurrency(costAnalysis.baseCost || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Peak Usage Cost</span>
                                <span className="font-medium">{formatCurrency(costAnalysis.peakCost || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Off-Peak Cost</span>
                                <span className="font-medium">{formatCurrency(costAnalysis.offPeakCost || 0)}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Taxes & Fees</span>
                                <span className="font-medium">{formatCurrency(costAnalysis.taxes || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-blue-800">Total Cost</span>
                                <span className="font-bold text-blue-800">{formatCurrency(totalCost)}</span>
                            </div>
                            {costAnalysis.projectedSavings && (
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span className="text-sm text-green-800">Potential Savings</span>
                                    <span className="font-medium text-green-800">
                                        {formatCurrency(costAnalysis.projectedSavings)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Savings Tips */}
            {tips.length > 0 && (
                <Card title="Energy Saving Tips" subtitle="Personalized recommendations">
                    <div className="space-y-3">
                        {tips.slice(0, 5).map((tip, index) => (
                            <div
                                key={index}
                                className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg"
                            >
                                <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Lightbulb className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{tip.title || tip.tip}</p>
                                    {tip.description && (
                                        <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                                    )}
                                    {tip.potentialSavings && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Potential savings: {formatCurrency(tip.potentialSavings)}/month
                                        </p>
                                    )}
                                </div>
                                {tip.priority && (
                                    <Badge
                                        variant={tip.priority === 'high' ? 'danger' : tip.priority === 'medium' ? 'warning' : 'default'}
                                        size="sm"
                                    >
                                        {tip.priority}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ReportPreview;
