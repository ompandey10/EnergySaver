import { useState } from 'react';
import {
    Bell,
    Save,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const Settings = () => {
    // Notification preferences
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        pushNotifications: false,
        weeklyReport: true,
        monthlyReport: true,
        alertThreshold: 80,
    });

    const handleSaveNotifications = () => {
        // TODO: Save to backend
        toast.success('Notification settings saved');
    };

    return (
        <DashboardLayout title="Settings">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                    <p className="text-sm text-gray-600">Manage your notification preferences</p>
                </div>

                {/* Notification Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Email Notifications" subtitle="Configure email alerts">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Alert Notifications</p>
                                    <p className="text-sm text-gray-500">
                                        Receive emails when alerts are triggered
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications.emailAlerts}
                                        onChange={(e) => setNotifications(prev => ({
                                            ...prev,
                                            emailAlerts: e.target.checked
                                        }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Weekly Summary</p>
                                    <p className="text-sm text-gray-500">
                                        Get a weekly energy usage summary
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications.weeklyReport}
                                        onChange={(e) => setNotifications(prev => ({
                                            ...prev,
                                            weeklyReport: e.target.checked
                                        }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Monthly Report</p>
                                    <p className="text-sm text-gray-500">
                                        Receive monthly detailed reports
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications.monthlyReport}
                                        onChange={(e) => setNotifications(prev => ({
                                            ...prev,
                                            monthlyReport: e.target.checked
                                        }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </Card>

                    <Card title="Alert Thresholds" subtitle="Set alert sensitivity">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alert Threshold: {notifications.alertThreshold}%
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    step="5"
                                    value={notifications.alertThreshold}
                                    onChange={(e) => setNotifications(prev => ({
                                        ...prev,
                                        alertThreshold: parseInt(e.target.value)
                                    }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Alert when {notifications.alertThreshold}% of limit is reached
                                </p>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <Bell className="h-4 w-4 inline mr-2" />
                                    Push notifications require browser permissions.
                                    Click "Enable" to allow notifications.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => {
                                        Notification.requestPermission().then(permission => {
                                            if (permission === 'granted') {
                                                toast.success('Push notifications enabled');
                                                setNotifications(prev => ({
                                                    ...prev,
                                                    pushNotifications: true
                                                }));
                                            }
                                        });
                                    }}
                                >
                                    Enable Push Notifications
                                </Button>
                            </div>

                            <Button className="w-full" onClick={handleSaveNotifications}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Notification Settings
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
