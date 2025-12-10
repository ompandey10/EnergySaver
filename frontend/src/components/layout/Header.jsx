import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title }) => {
    const { user } = useAuth();

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
                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
