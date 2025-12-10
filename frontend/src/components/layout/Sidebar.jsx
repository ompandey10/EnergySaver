import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    LayoutDashboard,
    Lightbulb,
    Bell,
    FileText,
    Settings,
    User,
    Menu,
    X,
    LogOut,
    BarChart3,
    Zap,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if user is admin (you may need to adjust based on your user model)
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Homes', icon: Home, path: '/homes' },
        { name: 'Devices', icon: Lightbulb, path: '/devices' },
        { name: 'Alerts', icon: Bell, path: '/alerts' },
        { name: 'Reports', icon: FileText, path: '/reports' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    const adminMenuItems = [
        { name: 'Device Templates', icon: Zap, path: '/admin/device-templates' },
        { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-center h-16 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-blue-600">EnergyFlow</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                return (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsOpen(false)}
                                            className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                        ${active
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }
                      `}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                );
                            })}

                            {/* Admin Section */}
                            {isAdmin && (
                                <>
                                    <li className="pt-4 mt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setShowAdminMenu(!showAdminMenu)}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <span className="text-xs font-semibold text-gray-600 uppercase">Admin</span>
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    </li>

                                    {showAdminMenu && adminMenuItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.path);
                                        return (
                                            <li key={item.path}>
                                                <Link
                                                    to={item.path}
                                                    onClick={() => setIsOpen(false)}
                                                    className={`
                            flex items-center space-x-3 px-4 py-3 ml-2 rounded-lg transition-colors text-sm
                            ${active
                                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                        }
                          `}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span>{item.name}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </>
                            )}
                        </ul>
                    </nav>

                    {/* User section */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="w-full justify-start text-gray-700"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
