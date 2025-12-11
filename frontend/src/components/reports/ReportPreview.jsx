import { TrendingUp, TrendingDown, IndianRupee, Zap, Lightbulb, Home, Activity, Clock } from 'lucide-react';
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

    // Handle both old format and new report format from API
    const report = reportData.report || reportData;
    const {
        summary = {},
        deviceBreakdown = [],
        dailyBreakdown = [],
        dailyConsumption = [],
        liveConsumption = null,
        costAnalysis = {},
        tips = [],
        period = {},
    } = report;

    const homeName = reportData.homeName || report.home?.name;
    const month = reportData.month || (period.start ? new Date(period.start).getMonth() + 1 : null);
    const year = reportData.year || (period.start ? new Date(period.start).getFullYear() : null);
    const isCurrentMonth = period.isCurrentMonth || false;

    const totalConsumption = summary.totalKWh || 0;
    const totalCost = summary.totalCost || costAnalysis.totalCost || 0;
    const avgDaily = summary.avgDailyKWh || summary.avgDaily || (totalConsumption / (period.days || 30));
    const previousMonth = summary.previousMonth || {};
    const percentChange = previousMonth.totalKWh
        ? ((totalConsumption - previousMonth.totalKWh) / previousMonth.totalKWh) * 100
        : 0;

    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    // Use deviceBreakdown from new API or old format
    const devices = deviceBreakdown.length > 0 ? deviceBreakdown : [];
    const daily = dailyBreakdown.length > 0 ? dailyBreakdown : dailyConsumption;

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
                    <div className="flex items-center space-x-2">
                        {isCurrentMonth && (
                            <Badge variant="info" size="lg">
                                <Activity className="h-4 w-4 mr-1 animate-pulse" />
                                Current Month
                            </Badge>
                        )}
                        <Badge variant={percentChange <= 0 ? 'success' : 'danger'} size="lg">
                            {percentChange <= 0 ? (
                                <TrendingDown className="h-4 w-4 mr-1" />
                            ) : (
                                <TrendingUp className="h-4 w-4 mr-1" />
                            )}
                            {Math.abs(percentChange).toFixed(1)}% vs last month
                        </Badge>
                    </div>
                </div>
            </Card>

            {/* Live Consumption Banner (Current Month Only) */}
            {isCurrentMonth && liveConsumption && liveConsumption.activeDeviceCount > 0 && (
                <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-full">
                                <Activity className="h-8 w-8" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm opacity-90">Live Consumption (Included in Report)</p>
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                </div>
                                <p className="text-3xl font-bold">{liveConsumption.totalWatts}W</p>
                                <p className="text-sm opacity-90">
                                    {liveConsumption.activeDeviceCount} device{liveConsumption.activeDeviceCount !== 1 ? 's' : ''} currently running
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-lg p-3 text-center">
                                <p className="text-xs opacity-75">Live Energy</p>
                                <p className="text-xl font-bold">{liveConsumption.totalKWh?.toFixed(4) || '0'}</p>
                                <p className="text-xs opacity-75">kWh</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3 text-center">
                                <p className="text-xs opacity-75">Live Cost</p>
                                <p className="text-xl font-bold text-yellow-200">₹{liveConsumption.totalCost?.toFixed(4) || '0'}</p>
                                <p className="text-xs opacity-75">INR</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Devices List */}
                    {liveConsumption.devices && liveConsumption.devices.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <p className="text-sm font-medium mb-3">Currently Active Devices:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {liveConsumption.devices.map((device, idx) => (
                                    <div key={idx} className="bg-white/10 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm">{device.name}</span>
                                            <span className="text-sm">{device.wattage}W</span>
                                        </div>
                                        <div className="flex items-center text-xs opacity-75">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Running for {device.sessionDuration?.toFixed(0) || 0} min
                                        </div>
                                        <div className="flex justify-between text-xs mt-1">
                                            <span>{device.sessionKWh?.toFixed(4) || '0'} kWh</span>
                                            <span className="text-yellow-200">₹{device.sessionCost?.toFixed(4) || '0'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

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
                            {isCurrentMonth && liveConsumption && (
                                <p className="text-xs text-green-600">
                                    Includes {liveConsumption.totalKWh?.toFixed(4) || 0} kWh live
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-full">
                            <IndianRupee className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Cost</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(totalCost)}
                            </p>
                            {isCurrentMonth && liveConsumption && (
                                <p className="text-xs text-green-600">
                                    Includes ₹{liveConsumption.totalCost?.toFixed(4) || 0} live
                                </p>
                            )}
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
                                {formatNumber(avgDaily, 4)} kWh
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
                                {summary.activeDevices || devices.length || summary.deviceCount || 0}
                            </p>
                            {isCurrentMonth && liveConsumption && (
                                <p className="text-xs text-green-600">
                                    {liveConsumption.activeDeviceCount} currently on
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Device Breakdown */}
            {devices.length > 0 && (
                <Card title="Device Consumption Breakdown" subtitle="Energy usage by device">
                    <div className="space-y-4">
                        {devices.map((device, index) => {
                            const deviceKWh = device.totalKWh || device.kWh || 0;
                            const percentage = totalConsumption > 0 ? (deviceKWh / totalConsumption) * 100 : 0;
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
                            const hasLiveData = device.liveKWh > 0;
                            return (
                                <div key={device._id || device.deviceId || index}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-700">
                                                {device.name || device.deviceName}
                                            </span>
                                            {hasLiveData && (
                                                <span className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
                                                    Live
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {formatEnergy(deviceKWh)} ({percentage.toFixed(1)}%)
                                            {hasLiveData && (
                                                <span className="text-green-600 ml-1">
                                                    (+{device.liveKWh.toFixed(4)} live)
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${colors[index % colors.length]}`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    {device.totalCost > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Cost: {formatCurrency(device.totalCost)}
                                            {hasLiveData && (
                                                <span className="text-green-600 ml-1">
                                                    (+₹{device.liveCost?.toFixed(4)} live)
                                                </span>
                                            )}
                                        </div>
                                    )}
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
