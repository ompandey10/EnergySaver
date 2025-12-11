import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, FileText, Loader2 } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { homeService } from '../../services/homeService';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';

const ReportGenerator = ({ onReportGenerated }) => {
    const currentDate = new Date();
    const [selectedHome, setSelectedHome] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Fetch homes
    const { data: homesData, isLoading: homesLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: () => homeService.getHomes(),
    });

    const homes = homesData?.data || [];

    // Generate available months (last 12 months)
    const months = [
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

    // Generate available years (current year and 2 previous years)
    const years = [];
    for (let i = 0; i <= 2; i++) {
        years.push(currentDate.getFullYear() - i);
    }

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
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/monthly?homeId=${selectedHome}&month=${selectedMonth}&year=${selectedYear}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to download report');
            }

            const blob = await response.blob();
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
            toast.error('Failed to download PDF report');
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
                                <option key={month.value} value={month.value}>
                                    {month.label}
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

                {/* Selected Period Info */}
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                        Report Period: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={handleGenerateReport}
                        disabled={!selectedHome || isGenerating}
                        isLoading={isGenerating}
                        className="flex-1"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDownloadPDF}
                        disabled={!selectedHome || isDownloading}
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
