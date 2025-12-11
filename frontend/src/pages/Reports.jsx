import { useState } from 'react';
import { FileText, BarChart3, DollarSign, Users } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ReportGenerator from '../components/reports/ReportGenerator';
import ReportPreview from '../components/reports/ReportPreview';
import NeighborhoodComparison from '../components/reports/NeighborhoodComparison';
import CostAnalysis from '../components/reports/CostAnalysis';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('generate');
    const [reportData, setReportData] = useState(null);

    const handleReportGenerated = (data) => {
        setReportData(data);
        // Auto-switch to preview tab when report is generated
        if (data) {
            setActiveTab('preview');
        }
    };

    const tabs = [
        { id: 'generate', label: 'Generate Report', icon: FileText },
        { id: 'preview', label: 'Report Preview', icon: FileText },
        { id: 'comparison', label: 'Neighborhood Comparison', icon: Users },
        { id: 'cost', label: 'Cost Analysis', icon: DollarSign },
    ];

    return (
        <DashboardLayout title="Reports">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Energy Reports</h2>
                    <p className="text-sm text-gray-600">
                        Generate reports, compare with neighbors, and analyze costs
                    </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                    {tab.id === 'preview' && reportData && (
                                        <span className="ml-2 bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs">
                                            Ready
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'generate' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ReportGenerator onReportGenerated={handleReportGenerated} />
                            <div className="lg:col-span-1">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 h-full">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Report Features
                                    </h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 flex-shrink-0">1</span>
                                            <span className="text-sm text-gray-700">
                                                Detailed energy consumption breakdown by device
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 flex-shrink-0">2</span>
                                            <span className="text-sm text-gray-700">
                                                Cost analysis with projected savings
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 flex-shrink-0">3</span>
                                            <span className="text-sm text-gray-700">
                                                Personalized energy-saving recommendations
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 flex-shrink-0">4</span>
                                            <span className="text-sm text-gray-700">
                                                Month-over-month comparison charts
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 flex-shrink-0">5</span>
                                            <span className="text-sm text-gray-700">
                                                Downloadable PDF reports
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preview' && (
                        <ReportPreview reportData={reportData} />
                    )}

                    {activeTab === 'comparison' && (
                        <NeighborhoodComparison />
                    )}

                    {activeTab === 'cost' && (
                        <CostAnalysis />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Reports;
