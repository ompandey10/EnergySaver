import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    User,
    Lock,
    Mail,
    Save,
    Camera,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, updateUser } = useAuth();

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    // Sync profile form with user data when user changes
    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data) => authService.updateProfile(data),
        onSuccess: (response) => {
            updateUser(response.user);
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

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DashboardLayout title="Profile">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                    <p className="text-sm text-gray-600">Manage your account information</p>
                </div>

                {/* Profile Header Card */}
                <Card>
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                                {getInitials(user?.name)}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50">
                                <Camera className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                            <p className="text-gray-500">{user?.email}</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Profile Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Update Profile */}
                    <Card title="Profile Information" subtitle="Update your personal details">
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <Input
                                label="Full Name"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                icon={User}
                            />
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
            </div>
        </DashboardLayout>
    );
};

export default Profile;
