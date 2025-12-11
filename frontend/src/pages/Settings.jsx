import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User,
    Lock,
    Home,
    Bell,
    Mail,
    DollarSign,
    Save,
    Plus,
    Trash2,
    Edit2,
    Check,
    X
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { homeService } from '../services/homeService';
import toast from 'react-hot-toast';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const { user, updateUser } = useAuth();
    const queryClient = useQueryClient();

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Notification preferences
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        pushNotifications: false,
        weeklyReport: true,
        monthlyReport: true,
        alertThreshold: 80,
    });

    // Home editing state
    const [editingHome, setEditingHome] = useState(null);
    const [homeModalOpen, setHomeModalOpen] = useState(false);
    const [homeForm, setHomeForm] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        homeType: 'house',
        squareFeet: '',
        energyRate: 0.12,
    });

    // Fetch homes
    const { data: homesData, isLoading: homesLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: () => homeService.getHomes(),
    });

    const homes = homesData?.data || [];

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data) => authService.updateProfile(data),
        onSuccess: (response) => {
            updateUser(response.data);
            toast.success('Profile updated successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: (data) => authService.changePassword(data.currentPassword, data.newPassword),
        onSuccess: () => {
            toast.success('Password changed successfully');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to change password');
        },
    });

    // Update home mutation
    const updateHomeMutation = useMutation({
        mutationFn: ({ id, data }) => homeService.updateHome(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['homes']);
            toast.success('Home updated successfully');
            setHomeModalOpen(false);
            setEditingHome(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update home');
        },
    });

    // Create home mutation
    const createHomeMutation = useMutation({
        mutationFn: (data) => homeService.createHome(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['homes']);
            toast.success('Home created successfully');
            setHomeModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create home');
        },
    });

    // Delete home mutation
    const deleteHomeMutation = useMutation({
        mutationFn: (id) => homeService.deleteHome(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['homes']);
            toast.success('Home removed successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to remove home');
        },
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate(profileForm);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        changePasswordMutation.mutate(passwordForm);
    };

    const handleEditHome = (home) => {
        setEditingHome(home);
        setHomeForm({
            name: home.name || '',
            address: home.address || '',
            city: home.city || '',
            state: home.state || '',
            zipCode: home.zipCode || '',
            homeType: home.homeType || 'house',
            squareFeet: home.squareFeet || '',
            energyRate: home.energyRate || 0.12,
        });
        setHomeModalOpen(true);
    };

    const handleAddHome = () => {
        setEditingHome(null);
        setHomeForm({
            name: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            homeType: 'house',
            squareFeet: '',
            energyRate: 0.12,
        });
        setHomeModalOpen(true);
    };

    const handleHomeSubmit = (e) => {
        e.preventDefault();
        if (editingHome) {
            updateHomeMutation.mutate({ id: editingHome._id, data: homeForm });
        } else {
            createHomeMutation.mutate(homeForm);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'homes', label: 'Homes', icon: Home },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <DashboardLayout title="Settings">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                    <p className="text-sm text-gray-600">Manage your account and preferences</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Update Profile */}
                            <Card title="Profile Information" subtitle="Update your personal details">
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="First Name"
                                            value={profileForm.firstName}
                                            onChange={(e) => setProfileForm(prev => ({
                                                ...prev,
                                                firstName: e.target.value
                                            }))}
                                            icon={User}
                                        />
                                        <Input
                                            label="Last Name"
                                            value={profileForm.lastName}
                                            onChange={(e) => setProfileForm(prev => ({
                                                ...prev,
                                                lastName: e.target.value
                                            }))}
                                        />
                                    </div>
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm(prev => ({
                                            ...prev,
                                            email: e.target.value
                                        }))}
                                        icon={Mail}
                                    />
                                    <Button
                                        type="submit"
                                        isLoading={updateProfileMutation.isLoading}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </form>
                            </Card>

                            {/* Change Password */}
                            <Card title="Change Password" subtitle="Update your password">
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <Input
                                        label="Current Password"
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm(prev => ({
                                            ...prev,
                                            currentPassword: e.target.value
                                        }))}
                                        icon={Lock}
                                    />
                                    <Input
                                        label="New Password"
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(prev => ({
                                            ...prev,
                                            newPassword: e.target.value
                                        }))}
                                        icon={Lock}
                                    />
                                    <Input
                                        label="Confirm New Password"
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(prev => ({
                                            ...prev,
                                            confirmPassword: e.target.value
                                        }))}
                                        icon={Lock}
                                    />
                                    <Button
                                        type="submit"
                                        isLoading={changePasswordMutation.isLoading}
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Update Password
                                    </Button>
                                </form>
                            </Card>
                        </div>
                    )}

                    {/* Home Settings */}
                    {activeTab === 'homes' && (
                        <Card
                            title="Your Homes"
                            subtitle="Manage your registered homes"
                            action={
                                <Button size="sm" onClick={handleAddHome}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Home
                                </Button>
                            }
                        >
                            {homesLoading ? (
                                <div className="flex justify-center py-12">
                                    <Spinner size="lg" />
                                </div>
                            ) : homes.length === 0 ? (
                                <div className="text-center py-12">
                                    <Home className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No homes</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Add your first home to start tracking energy usage.
                                    </p>
                                    <Button size="sm" className="mt-4" onClick={handleAddHome}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Home
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {homes.map((home) => (
                                        <div
                                            key={home._id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="p-3 bg-blue-100 rounded-lg">
                                                    <Home className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{home.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {home.address}, {home.city}, {home.state} {home.zipCode}
                                                    </p>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <Badge variant="primary" size="sm">
                                                            {home.homeType}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {home.squareFeet} sq ft
                                                        </span>
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <DollarSign className="h-3 w-3" />
                                                            {home.energyRate}/kWh
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditHome(home)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to remove this home?')) {
                                                            deleteHomeMutation.mutate(home._id);
                                                        }
                                                    }}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
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

                                    <Button className="w-full">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Notification Settings
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Home Modal */}
                <Modal
                    isOpen={homeModalOpen}
                    onClose={() => setHomeModalOpen(false)}
                    title={editingHome ? 'Edit Home' : 'Add New Home'}
                    size="lg"
                >
                    <form onSubmit={handleHomeSubmit} className="space-y-4">
                        <Input
                            label="Home Name"
                            value={homeForm.name}
                            onChange={(e) => setHomeForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., My House"
                            required
                        />
                        <Input
                            label="Street Address"
                            value={homeForm.address}
                            onChange={(e) => setHomeForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="123 Main St"
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="City"
                                value={homeForm.city}
                                onChange={(e) => setHomeForm(prev => ({ ...prev, city: e.target.value }))}
                            />
                            <Input
                                label="State"
                                value={homeForm.state}
                                onChange={(e) => setHomeForm(prev => ({ ...prev, state: e.target.value }))}
                            />
                            <Input
                                label="ZIP Code"
                                value={homeForm.zipCode}
                                onChange={(e) => setHomeForm(prev => ({ ...prev, zipCode: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Home Type
                                </label>
                                <select
                                    value={homeForm.homeType}
                                    onChange={(e) => setHomeForm(prev => ({ ...prev, homeType: e.target.value }))}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="house">House</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="condo">Condo</option>
                                    <option value="townhouse">Townhouse</option>
                                </select>
                            </div>
                            <Input
                                label="Square Feet"
                                type="number"
                                value={homeForm.squareFeet}
                                onChange={(e) => setHomeForm(prev => ({ ...prev, squareFeet: e.target.value }))}
                                placeholder="e.g., 1500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Energy Rate ($/kWh)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={homeForm.energyRate}
                                    onChange={(e) => setHomeForm(prev => ({ ...prev, energyRate: parseFloat(e.target.value) }))}
                                    className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Check your utility bill for your rate
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button type="button" variant="secondary" onClick={() => setHomeModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                isLoading={createHomeMutation.isLoading || updateHomeMutation.isLoading}
                            >
                                {editingHome ? 'Update Home' : 'Add Home'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
