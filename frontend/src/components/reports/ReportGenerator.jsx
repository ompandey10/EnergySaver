import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { homeService } from '../../services/homeService';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../../config/constants';
import toast from 'react-hot-toast';

const ReportGenerator = ({ onReportGenerated }) => {
    const { user } = useAuth();
    const currentDate = new Date();
    const [selectedHome, setSelectedHome] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Get account creation date
    const accountCreatedAt = useMemo(() => {
        if (user?.createdAt) {
            return new Date(user.createdAt);
        }
        return null;
    }, [user]);

    const accountCreationMonth = accountCreatedAt?.getMonth() + 1;
    const accountCreationYear = accountCreatedAt?.getFullYear();

    // Fetch homes
    const { data: homesData, isLoading: homesLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: () => homeService.getHomes(),
    });

    const homes = homesData?.homes || [];

    // All months
    const allMonths = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    // Filter months based on account creation and selected year
    const months = useMemo(() => {
        return allMonths.map(month => {
            // Check if this month is before account creation
            let isDisabled = false;
            if (accountCreationYear && accountCreationMonth) {
                if (selectedYear < accountCreationYear) {
                    isDisabled = true;
                } else if (selectedYear === accountCreationYear && month.value < accountCreationMonth) {
                    isDisabled = true;
                }
            }
            // Also disable future months
            if (selectedYear === currentDate.getFullYear() && month.value > currentDate.getMonth() + 1) {
                isDisabled = true;
            }
            return { ...month, disabled: isDisabled };
        });
    }, [selectedYear, accountCreationYear, accountCreationMonth, currentDate]);

    // Generate available years (from account creation year to current year)
    const years = useMemo(() => {
        const yearList = [];
        const startYear = accountCreationYear || (currentDate.getFullYear() - 2);
        for (let y = currentDate.getFullYear(); y >= startYear; y--) {
            yearList.push(y);
        }
        return yearList;
    }, [accountCreationYear, currentDate]);

    // Check if selected period is valid (not before account creation)
    const isSelectedPeriodValid = useMemo(() => {
        if (!accountCreationYear || !accountCreationMonth) return true;
        if (selectedYear < accountCreationYear) return false;
        if (selectedYear === accountCreationYear && selectedMonth < accountCreationMonth) return false;
        return true;
    }, [selectedYear, selectedMonth, accountCreationYear, accountCreationMonth]);

    const handleGenerateReport = async () => {
        if (!selectedHome) {
            toast.error('Please select a home');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await reportService.getConsumptionReport(selectedHome, {
                month: selectedMonth,
                year: selectedYear,
            });

            if (onReportGenerated) {
                onReportGenerated({
                    ...response.data,
                    homeId: selectedHome,
                    month: selectedMonth,
                    year: selectedYear,
                    homeName: homes.find(h => h._id === selectedHome)?.name,
                });
            }
            toast.success('Report generated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate report');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedHome) {
            toast.error('Please select a home');
            return;
        }

        setIsDownloading(true);
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                toast.error('Please login to download reports');
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/reports/monthly?homeId=${selectedHome}&month=${selectedMonth}&year=${selectedYear}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                // Try to parse error message from response
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to download report');
                }
                throw new Error(`Failed to download report (${response.status})`);
            }

            const blob = await response.blob();

            // Check if we got a valid PDF
            if (blob.size === 0) {
                throw new Error('No data available for this period');
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `energy-report-${selectedMonth}-${selectedYear}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Report downloaded successfully');
        } catch (error) {
            console.error('PDF download error:', error);
            toast.error(error.message || 'Failed to download PDF report');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Card title="Generate Report" subtitle="Create monthly energy consumption reports">
            <div className="space-y-6">
                {/* Home Selection */}
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

                {/* Month/Year Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            {months.map(month => (
                                <option
                                    key={month.value}
                                    value={month.value}
                                    disabled={month.disabled}
                                >
                                    {month.label}{month.disabled ? ' (N/A)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Warning for invalid period */}
                {!isSelectedPeriodValid && (
                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-red-700">
                            Cannot generate reports before your account was created
                            ({allMonths[accountCreationMonth - 1]?.label} {accountCreationYear})
                        </span>
                    </div>
                )}

                {/* Selected Period Info */}
                {isSelectedPeriodValid && (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm text-blue-800">
                            Report Period: {allMonths.find(m => m.value === selectedMonth)?.label} {selectedYear}
                        </span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={handleGenerateReport}
                        disabled={!selectedHome || isGenerating || !isSelectedPeriodValid}
                        isLoading={isGenerating}
                        className="flex-1"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDownloadPDF}
                        disabled={!selectedHome || isDownloading || !isSelectedPeriodValid}
                        isLoading={isDownloading}
                        className="flex-1"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ReportGenerator;
