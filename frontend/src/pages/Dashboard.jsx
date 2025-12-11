import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Zap,
    Home,
    TrendingUp,
    IndianRupee,
    Activity,
    AlertTriangle,
    Power,
    Clock,
    RefreshCw
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { homeService } from '../services/homeService';
import { deviceService } from '../services/deviceService';
import { alertService } from '../services/alertService';
import { formatCurrency, formatEnergy } from '../utils/helpers';

// Helper to format running time
const formatRunningTime = (startDate) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (diffHours > 0) {
        return `${diffHours}h ${mins}m`;
    }
    return `${mins}m`;
};

// Active Device Card with live consumption
const ActiveDeviceCard = ({ device }) => {
    const [consumption, setConsumption] = useState(null);
    const [runningTime, setRunningTime] = useState(null);
    const intervalRef = useRef(null);
    const consumptionIntervalRef = useRef(null);

    useEffect(() => {
        const fetchConsumption = async () => {
            try {
                const data = await deviceService.getCurrentConsumption(device._id);
                setConsumption(data.consumption);
            } catch (error) {
                console.error('Error fetching consumption:', error);
            }
        };

        fetchConsumption();

        if (device.lastTurnedOn) {
            setRunningTime(formatRunningTime(device.lastTurnedOn));
            intervalRef.current = setInterval(() => {
                setRunningTime(formatRunningTime(device.lastTurnedOn));
            }, 1000);
            consumptionIntervalRef.current = setInterval(fetchConsumption, 5000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (consumptionIntervalRef.current) clearInterval(consumptionIntervalRef.current);
        };
    }, [device._id, device.lastTurnedOn]);

    return (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">{device.name}</p>
                    <p className="text-xs text-gray-500">{device.location || device.home?.name}</p>
                </div>
            </div>
            <div className="text-right">
                <div className="flex items-center text-sm font-semibold text-green-600">
                    <Activity className="h-4 w-4 mr-1" />
                    {consumption?.currentWatts || device.wattage || 0}W
                </div>
                {runningTime && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {runningTime}
                    </div>
                )}
                {consumption?.sessionKWh > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                        {consumption.sessionKWh.toFixed(4)} kWh
                    </p>
                )}
                {consumption?.sessionCost > 0 && (
                    <p className="text-xs font-medium text-orange-600 mt-1">
                        ₹{consumption.sessionCost.toFixed(4)}
                    </p>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue', subtitle, live = false }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        yellow: 'bg-yellow-100 text-yellow-600',
    };

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">{title}</p>
                        {live && (
                            <span className="flex items-center text-xs text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                                Live
                            </span>
                        )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend !== undefined && (
                        <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-full ${colors[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </Card>
    );
};

const Dashboard = () => {
    const queryClient = useQueryClient();
    const [totalLiveConsumption, setTotalLiveConsumption] = useState(0);
    const [totalLiveKWh, setTotalLiveKWh] = useState(0);
    const [totalLiveCost, setTotalLiveCost] = useState(0);
    const liveIntervalRef = useRef(null);

    const { data: homesData, isLoading: homesLoading } = useQuery({
        queryKey: ['homes'],
        queryFn: homeService.getHomes,
    });

    const primaryHomeId = homesData?.homes?.[0]?._id;
    const primaryHome = homesData?.homes?.[0];
    const tariffStructure = primaryHome?.tariffStructure || 'slab';
    const electricityRate = primaryHome?.electricityRate || 6;

    // Get devices for the primary home
    const { data: devicesData, isLoading: devicesLoading } = useQuery({
        queryKey: ['devices', primaryHomeId],
        queryFn: () => deviceService.getDevices(primaryHomeId),
        enabled: !!primaryHomeId,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const { data: alertsData, isLoading: alertsLoading } = useQuery({
        queryKey: ['triggeredAlerts'],
        queryFn: () => alertService.getTriggeredAlerts({ limit: 5 }),
    });

    const devices = devicesData?.devices || [];
    const activeDevices = devices.filter(d => d.isActive);

    // Calculate live total consumption, kWh and cost from active devices
    useEffect(() => {
        const calculateLiveStats = async () => {
            // Calculate total watts
            const totalWatts = activeDevices.reduce((sum, device) => sum + (device.wattage || 0), 0);
            setTotalLiveConsumption(totalWatts);

            // Fetch consumption for each active device and sum up
            let totalKWh = 0;
            let totalCost = 0;

            for (const device of activeDevices) {
                try {
                    const data = await deviceService.getCurrentConsumption(device._id);
                    if (data.consumption) {
                        totalKWh += data.consumption.sessionKWh || 0;
                        totalCost += data.consumption.sessionCost || 0;
                    }
                } catch (error) {
                    console.error('Error fetching device consumption:', error);
                }
            }

            setTotalLiveKWh(totalKWh);
            setTotalLiveCost(totalCost);
        };

        calculateLiveStats();

        if (activeDevices.length > 0) {
            liveIntervalRef.current = setInterval(calculateLiveStats, 5000);
        }

        return () => {
            if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
        };
    }, [activeDevices]);

    const isLoading = homesLoading || alertsLoading || devicesLoading;

    if (isLoading) {
        return (
            <DashboardLayout title="Dashboard">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    const homes = homesData?.homes || [];
    const alerts = alertsData?.triggeredAlerts || [];

    // Calculate stats
    const totalDevices = devices.length;
    const totalConsumption = homes.reduce((sum, home) => sum + (home.totalConsumption || 0), 0);
    const totalCost = homes.reduce((sum, home) => sum + (home.totalCost || 0), 0);
    const activeAlerts = alerts.filter(a => !a.acknowledged).length;

    return (
        <DashboardLayout title="Dashboard">
            <div className="space-y-6">
                {/* Live Consumption Banner (if any device is active) */}
                {activeDevices.length > 0 && (
                    <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-white/20 rounded-full">
                                    <Activity className="h-8 w-8" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm opacity-90">Live Power Consumption</p>
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    </div>
                                    <p className="text-3xl font-bold">{totalLiveConsumption}W</p>
                                    <p className="text-sm opacity-90 mt-1">
                                        {activeDevices.length} device{activeDevices.length !== 1 ? 's' : ''} currently running
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                <div className="bg-white/10 rounded-lg p-3 text-center">
                                    <p className="text-xs opacity-75">Total Energy</p>
                                    <p className="text-xl font-bold">{totalLiveKWh.toFixed(4)}</p>
                                    <p className="text-xs opacity-75">kWh</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 text-center">
                                    <p className="text-xs opacity-75">Total Cost</p>
                                    <p className="text-xl font-bold text-yellow-200">₹{totalLiveCost.toFixed(4)}</p>
                                    <p className="text-xs opacity-75">INR</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 text-center col-span-2 md:col-span-1">
                                    <p className="text-xs opacity-75">Tariff</p>
                                    <p className="text-xl font-bold">{tariffStructure === 'slab' ? 'Slab' : `₹${electricityRate.toFixed(2)}`}</p>
                                    <p className="text-xs opacity-75">{tariffStructure === 'slab' ? '₹3-8.50/kWh' : 'per kWh'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Homes"
                        value={homes.length}
                        icon={Home}
                        color="blue"
                    />
                    <StatCard
                        title="Total Devices"
                        value={totalDevices}
                        icon={Zap}
                        subtitle={`${activeDevices.length} currently active`}
                        color="green"
                    />
                    <StatCard
                        title="Live Energy"
                        value={`${totalLiveKWh.toFixed(4)} kWh`}
                        icon={Activity}
                        subtitle={`${totalLiveConsumption}W current power`}
                        live={activeDevices.length > 0}
                        color="blue"
                    />
                    <StatCard
                        title="Live Cost"
                        value={`₹${totalLiveCost.toFixed(4)}`}
                        icon={IndianRupee}
                        subtitle={tariffStructure === 'slab' ? 'Slab-based pricing' : `Rate: ₹${electricityRate.toFixed(2)}/kWh`}
                        live={activeDevices.length > 0}
                        color="yellow"
                    />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Alerts */}
                    <Card title="Recent Alerts" subtitle="Latest triggered alerts">
                        {alerts.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No recent alerts</p>
                        ) : (
                            <div className="space-y-3">
                                {alerts.slice(0, 5).map((alert) => (
                                    <div
                                        key={alert._id}
                                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {alert.alert?.name || 'Alert'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {alert.device?.name || 'Unknown Device'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(alert.triggeredAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!alert.acknowledged && (
                                            <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Homes Overview */}
                    <Card title="Your Homes" subtitle="Overview of registered homes">
                        {homes.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No homes registered</p>
                        ) : (
                            <div className="space-y-3">
                                {homes.slice(0, 5).map((home) => (
                                    <div
                                        key={home._id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{home.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {home.devices?.length || 0} devices • {home.city}, {home.state}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatEnergy(home.totalConsumption || 0)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatCurrency(home.totalCost || 0)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Active Devices - Real-time tracking */}
                {activeDevices.length > 0 && (
                    <Card
                        title="Active Devices"
                        subtitle="Currently running devices with live consumption"
                        action={
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Auto-updating</span>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeDevices.map((device) => (
                                <ActiveDeviceCard key={device._id} device={device} />
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
