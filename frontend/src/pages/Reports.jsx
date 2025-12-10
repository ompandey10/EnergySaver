import { FileText, Download, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const Reports = () => {
    return (
        <DashboardLayout title="Reports">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Energy Reports</h2>
                        <p className="text-sm text-gray-600">Generate and view your energy consumption reports</p>
                    </div>
                    <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                    </Button>
                </div>

                {/* Report Types */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <div className="text-center py-6">
                            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Consumption Report</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Detailed analysis of energy consumption patterns
                            </p>
                            <Button variant="outline" size="sm" className="mt-4">
                                Generate
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <div className="text-center py-6">
                            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Comparison Report</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Compare energy usage across different periods
                            </p>
                            <Button variant="outline" size="sm" className="mt-4">
                                Generate
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <div className="text-center py-6">
                            <div className="mx-auto h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <Download className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Custom Report</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Create custom reports with specific parameters
                            </p>
                            <Button variant="outline" size="sm" className="mt-4">
                                Generate
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Recent Reports */}
                <Card title="Recent Reports" subtitle="Your previously generated reports">
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Generate your first report to get started with energy analytics.
                        </p>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Reports;
