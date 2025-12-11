import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, TrendingUp, TrendingDown, Calculator, PiggyBank, Calendar, Home } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import Input from '../common/Input';
import Button from '../common/Button';
import { homeService } from '../../services/homeService';
import { reportService } from '../../services/reportService';
import { formatCurrency, formatNumber } from '../../utils/helpers';

const CostAnalysis = () => {
    const [selectedHome, setSelectedHome] = useState('');
    const [analysisType, setAnalysisType] = useState('comparison');

    // ROI Calculator state
    const [investmentCost, setInvestmentCost] = useState('');
    const [monthlySavings, setMonthlySavings] = useState('');
    const [showROI, setShowROI] = useState(false);

    // Fetch homes
    const { data: homesData, isLoading: homesLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: () => homeService.getHomes(),
    });

    // Fetch cost analysis
    const { data: costData, isLoading: costLoading } = useQuery({
        queryKey: ['costAnalysis', selectedHome, analysisType],
        queryFn: () => reportService.getCostAnalysis
            ? reportService.getCostAnalysis({ homeId: selectedHome, analysisType })
            : Promise.resolve({ data: {} }),
        enabled: !!selectedHome,
    });

    const homes = homesData?.homes || [];
    const analysis = costData?.analysis || costData?.data || {};

    // Calculate ROI
    const calculateROI = () => {
        const investment = parseFloat(investmentCost);
        const savings = parseFloat(monthlySavings);

        if (investment > 0 && savings > 0) {
            const paybackMonths = Math.ceil(investment / savings);
            const yearlyReturn = (savings * 12 / investment) * 100;
            const fiveYearSavings = savings * 60 - investment;

            return {
                paybackMonths,
                paybackYears: (paybackMonths / 12).toFixed(1),
                yearlyReturn: yearlyReturn.toFixed(1),
                fiveYearSavings,
                monthlyROI: ((savings / investment) * 100).toFixed(2),
            };
        }
        return null;
    };

    const roiResults = calculateROI();

    // Mock monthly trend data (would come from API)
    const monthlyTrends = analysis.monthlyTrends || [
        { month: 'Jul', cost: 120 },
        { month: 'Aug', cost: 145 },
        { month: 'Sep', cost: 130 },
        { month: 'Oct', cost: 110 },
        { month: 'Nov', cost: 95 },
        { month: 'Dec', cost: 85 },
    ];

    const maxCost = Math.max(...monthlyTrends.map(m => m.cost));

    return (
        <Card title="Cost Analysis" subtitle="Track and optimize your energy costs">
            <div className="space-y-6">
                {/* Home Selector */}
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
                            Analysis Type
                        </label>
                        <select
                            value={analysisType}
                            onChange={(e) => setAnalysisType(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="comparison">Month Comparison</option>
                            <option value="projection">Projection</option>
                            <option value="monthly">Current Month</option>
                        </select>
                    </div>
                </div>

                {!selectedHome ? (
                    <div className="text-center py-12">
                        <IndianRupee className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Select a home</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Choose a home to view cost analysis.
                        </p>
                    </div>
                ) : costLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Cost Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <IndianRupee className="h-8 w-8 text-blue-600" />
                                    {analysis.costChange !== undefined && (
                                        <Badge variant={analysis.costChange <= 0 ? 'success' : 'danger'} size="sm">
                                            {analysis.costChange <= 0 ? (
                                                <TrendingDown className="h-3 w-3 mr-1" />
                                            ) : (
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                            )}
                                            {Math.abs(analysis.costChange || 0).toFixed(1)}%
                                        </Badge>
                                    )}
                                </div>
                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {formatCurrency(analysis.currentMonthCost || 0)}
                                </p>
                                <p className="text-sm text-gray-600">Current Month</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <PiggyBank className="h-8 w-8 text-green-600" />
                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {formatCurrency(analysis.projectedSavings || 0)}
                                </p>
                                <p className="text-sm text-gray-600">Potential Savings</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <Calendar className="h-8 w-8 text-purple-600" />
                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {formatCurrency(analysis.yearToDateCost || 0)}
                                </p>
                                <p className="text-sm text-gray-600">Year to Date</p>
                            </div>
                        </div>

                        {/* Monthly Cost Trend */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-4">Monthly Cost Trend</h4>
                            <div className="flex items-end justify-between space-x-2 h-40">
                                {monthlyTrends.map((month, index) => (
                                    <div key={index} className="flex flex-col items-center flex-1">
                                        <div className="w-full flex justify-center">
                                            <div
                                                className="w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                                                style={{ height: `${(month.cost / maxCost) * 120}px` }}
                                                title={formatCurrency(month.cost)}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        {analysis.breakdown && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-4">Cost Breakdown</h4>
                                <div className="space-y-3">
                                    {Object.entries(analysis.breakdown).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            <span className="font-medium">{formatCurrency(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ROI Calculator */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Calculator className="h-5 w-5 text-gray-600 mr-2" />
                                    <h4 className="text-sm font-medium text-gray-700">ROI Calculator</h4>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowROI(!showROI)}
                                >
                                    {showROI ? 'Hide' : 'Show'}
                                </Button>
                            </div>

                            {showROI && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        Calculate the return on investment for energy-saving upgrades.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Investment Cost ($)"
                                            type="number"
                                            placeholder="e.g., 500"
                                            value={investmentCost}
                                            onChange={(e) => setInvestmentCost(e.target.value)}
                                        />
                                        <Input
                                            label="Est. Monthly Savings ($)"
                                            type="number"
                                            placeholder="e.g., 50"
                                            value={monthlySavings}
                                            onChange={(e) => setMonthlySavings(e.target.value)}
                                        />
                                    </div>

                                    {roiResults && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-blue-600">
                                                    {roiResults.paybackMonths} mo
                                                </p>
                                                <p className="text-xs text-gray-500">Payback Period</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-green-600">
                                                    {roiResults.yearlyReturn}%
                                                </p>
                                                <p className="text-xs text-gray-500">Annual ROI</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-purple-600">
                                                    {formatCurrency(roiResults.fiveYearSavings)}
                                                </p>
                                                <p className="text-xs text-gray-500">5-Year Net Savings</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-orange-600">
                                                    {roiResults.paybackYears} yrs
                                                </p>
                                                <p className="text-xs text-gray-500">Break-Even</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default CostAnalysis;
