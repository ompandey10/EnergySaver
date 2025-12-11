import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Users, TrendingUp, TrendingDown, Award, Home } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import { homeService } from '../../services/homeService';
import { reportService } from '../../services/reportService';
import { formatEnergy, formatNumber } from '../../utils/helpers';

const NeighborhoodComparison = () => {
    const [selectedHome, setSelectedHome] = useState('');
    const [comparisonType, setComparisonType] = useState('neighborhood');

    // Fetch homes
    const { data: homesData, isLoading: homesLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: () => homeService.getHomes(),
    });

    // Fetch comparison data
    const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
        queryKey: ['comparison', selectedHome, comparisonType],
        queryFn: () => reportService.getComparisonReport({
            homeId: selectedHome,
            comparisonType,
        }),
        enabled: !!selectedHome,
    });

    const homes = homesData?.data || [];
    const comparison = comparisonData?.data || {};

    const getPercentileColor = (percentile) => {
        if (percentile <= 25) return 'text-green-600 bg-green-100';
        if (percentile <= 50) return 'text-blue-600 bg-blue-100';
        if (percentile <= 75) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getPercentileLabel = (percentile) => {
        if (percentile <= 25) return 'Excellent';
        if (percentile <= 50) return 'Good';
        if (percentile <= 75) return 'Average';
        return 'Above Average';
    };

    const renderComparisonBar = (userValue, avgValue, label, maxValue) => {
        const userPercent = Math.min((userValue / maxValue) * 100, 100);
        const avgPercent = Math.min((avgValue / maxValue) * 100, 100);
        const difference = ((userValue - avgValue) / avgValue) * 100;

        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <div className="flex items-center space-x-2">
                        {difference < 0 ? (
                            <Badge variant="success" size="sm">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {Math.abs(difference).toFixed(1)}% less
                            </Badge>
                        ) : difference > 0 ? (
                            <Badge variant="danger" size="sm">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {difference.toFixed(1)}% more
                            </Badge>
                        ) : (
                            <Badge variant="default" size="sm">Same</Badge>
                        )}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center">
                        <span className="w-20 text-xs text-gray-500">You</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                                className="h-3 rounded-full bg-blue-500"
                                style={{ width: `${userPercent}%` }}
                            ></div>
                        </div>
                        <span className="w-24 text-right text-xs text-gray-600">
                            {formatEnergy(userValue)}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-20 text-xs text-gray-500">Avg</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                                className="h-3 rounded-full bg-gray-400"
                                style={{ width: `${avgPercent}%` }}
                            ></div>
                        </div>
                        <span className="w-24 text-right text-xs text-gray-600">
                            {formatEnergy(avgValue)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card
            title="Neighborhood Comparison"
            subtitle="See how your energy usage compares to others"
        >
            <div className="space-y-6">
                {/* Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Home
                        </label>
                        <select
                            value={selectedHome}
                            onChange={(e) => setSelectedHome(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            disabled={homesLoading}
                        >
                            <option value="">Select a home</option>
                            {homes.map(home => (
                                <option key={home._id} value={home._id}>
                                    {home.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Compare By
                        </label>
                        <select
                            value={comparisonType}
                            onChange={(e) => setComparisonType(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="neighborhood">Neighborhood (ZIP Code)</option>
                            <option value="size">Similar Home Size</option>
                            <option value="type">Same Home Type</option>
                        </select>
                    </div>
                </div>

                {!selectedHome ? (
                    <div className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Select a home</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Choose a home to compare your energy usage with others.
                        </p>
                    </div>
                ) : comparisonLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : comparison && Object.keys(comparison).length > 0 ? (
                    <div className="space-y-6">
                        {/* Percentile Ranking */}
                        {comparison.percentile !== undefined && (
                            <div className="flex items-center justify-center">
                                <div className={`text-center p-6 rounded-xl ${getPercentileColor(comparison.percentile)}`}>
                                    <Award className="h-10 w-10 mx-auto mb-2" />
                                    <p className="text-3xl font-bold">{comparison.percentile}th</p>
                                    <p className="text-sm font-medium">Percentile</p>
                                    <p className="text-xs mt-1">{getPercentileLabel(comparison.percentile)}</p>
                                </div>
                            </div>
                        )}

                        {/* Usage Comparison */}
                        <div className="space-y-6">
                            {comparison.userConsumption !== undefined && comparison.avgConsumption !== undefined && (
                                renderComparisonBar(
                                    comparison.userConsumption,
                                    comparison.avgConsumption,
                                    'Monthly Usage',
                                    Math.max(comparison.userConsumption, comparison.avgConsumption) * 1.2
                                )
                            )}

                            {comparison.dailyAvg !== undefined && comparison.neighborhoodDailyAvg !== undefined && (
                                renderComparisonBar(
                                    comparison.dailyAvg,
                                    comparison.neighborhoodDailyAvg,
                                    'Daily Average',
                                    Math.max(comparison.dailyAvg, comparison.neighborhoodDailyAvg) * 1.2
                                )
                            )}

                            {comparison.peakUsage !== undefined && comparison.avgPeakUsage !== undefined && (
                                renderComparisonBar(
                                    comparison.peakUsage,
                                    comparison.avgPeakUsage,
                                    'Peak Usage',
                                    Math.max(comparison.peakUsage, comparison.avgPeakUsage) * 1.2
                                )
                            )}
                        </div>

                        {/* Statistics */}
                        {comparison.stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {comparison.stats.totalHomes || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">Homes Compared</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatNumber(comparison.stats.avgUsage || 0, 1)}
                                    </p>
                                    <p className="text-xs text-gray-500">Avg. kWh/month</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatNumber(comparison.stats.minUsage || 0, 1)}
                                    </p>
                                    <p className="text-xs text-gray-500">Lowest kWh</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatNumber(comparison.stats.maxUsage || 0, 1)}
                                    </p>
                                    <p className="text-xs text-gray-500">Highest kWh</p>
                                </div>
                            </div>
                        )}

                        {/* Top Consumers (Anonymous) */}
                        {comparison.topConsumers && comparison.topConsumers.length > 0 && (
                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                    Top Consumers in Your Area (Anonymous)
                                </h4>
                                <div className="space-y-2">
                                    {comparison.topConsumers.map((consumer, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center">
                                                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                        index === 1 ? 'bg-gray-200 text-gray-700' :
                                                            index === 2 ? 'bg-orange-100 text-orange-800' :
                                                                'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                                <span className="ml-2 text-sm text-gray-600">
                                                    Home #{consumer.id || index + 1}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatEnergy(consumer.consumption)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No comparison data</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Not enough data available for comparison in your area.
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default NeighborhoodComparison;
