import { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const profileMenuRef = useRef(null);
    const notificationsRef = useRef(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Search */}
                        <div className="hidden md:block relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>

                        {/* Notifications */}
                        <div className="relative" ref={notificationsRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Bell className="h-6 w-6" />
                                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-4 border-b border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        <div className="p-4 space-y-3">
                                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <p className="text-xs font-medium text-yellow-800">High energy usage alert</p>
                                                <p className="text-xs text-yellow-700 mt-1">Your living room exceeded threshold</p>
                                                <p className="text-xs text-yellow-600 mt-2">5 minutes ago</p>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-xs font-medium text-blue-800">Device offline</p>
                                                <p className="text-xs text-blue-700 mt-1">Kitchen refrigerator went offline</p>
                                                <p className="text-xs text-blue-600 mt-2">2 hours ago</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 border-t border-gray-200 text-center">
                                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Menu */}
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                                    {user?.name || 'User'}
                                </span>
                                <ChevronDown className="hidden sm:inline h-4 w-4 text-gray-600" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-4 border-b border-gray-200">
                                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                                    </div>

                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                setShowProfileMenu(false);
                                            }}
                                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <User className="h-4 w-4" />
                                            <span>My Profile</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                navigate('/settings');
                                                setShowProfileMenu(false);
                                            }}
                                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span>Settings</span>
                                        </button>
                                    </div>

                                    <div className="p-2 border-t border-gray-200">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
