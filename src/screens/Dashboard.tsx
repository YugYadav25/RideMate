import { User, Search, Car, LogOut, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAccessibility } from '../context/AccessibilityContext';
import DriverDashboard from '../components/DriverDashboard';
import RiderDashboard from '../components/RiderDashboard';
import Button from '../components/Button';
import Layout from '../components/Layout';
import NotificationPanel from '../components/NotificationPanel';
import { notificationApi } from '../services/notifications';
import GreenStatsCard from '../components/GreenStatsCard';

export default function Dashboard() {
  const { navigateTo, userRole, userName, logout, user } = useApp();
  const { isSeniorMode } = useAccessibility();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationApi.list(true);
        setUnreadCount(response.unreadCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigateTo('landing');
  };

  return (
    <Layout fullWidth className="bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-gray-100 rounded-full translate-x-1/3 -translate-y-1/3 opacity-50 blur-3xl" />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.35em] text-gray-400">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold text-black leading-tight">
              Welcome back, <span className="capitalize">{userName || (userRole === 'driver' ? 'Driver' : 'Rider')}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-3 rounded-xl border-2 border-black hover:bg-gray-100 transition-all"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <Button variant="secondary" onClick={() => navigateTo('profile')} className="hidden sm:flex items-center gap-2 border-2 border-black hover:bg-gray-100 transition-colors">
              <User size={18} />
              Profile
            </Button>
            <button
              onClick={handleLogout}
              className="hidden sm:block p-3 rounded-xl border-2 border-black hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onNotificationClick={() => {
            // Refresh unread count when notification is clicked
            notificationApi.list(true).then(response => setUnreadCount(response.unreadCount));
          }}
        />

        <div className="mb-12">
          <div className="rounded-3xl bg-black text-white p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] border-2 border-black animate-slide-in">
            <div className="flex flex-row items-center gap-6 mb-6 sm:mb-0">
              <div className="p-6 bg-white/10 rounded-2xl border-2 border-white/20 backdrop-blur-sm inline-flex justify-center">
                {userRole === 'driver' ? <Car size={56} className="text-white" strokeWidth={1.5} /> : <Search size={56} className="text-white" strokeWidth={1.5} />}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-2">Quick Action</p>
                <h2 className="text-3xl sm:text-4xl font-bold">{userRole === 'driver' ? 'Post a Ride' : 'Find a Ride'}</h2>
                <p className="text-white/70 mt-2 max-w-md">
                  {userRole === 'driver'
                    ? 'Going somewhere? Share your ride.'
                    : 'Need a lift? Find a ride.'}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-lg font-bold border-2 border-white hover:bg-white hover:text-black transition-all transform hover:-translate-y-1"
                onClick={() => navigateTo(userRole === 'driver' ? 'create-ride' : 'search-ride')}
              >
                {userRole === 'driver' ? 'Create Ride' : 'Search Ride'}
              </Button>
            </div>
          </div>


          {/* GreenMiles Stats - Hidden in Senior Mode */}
          {!isSeniorMode && (
            <div className="mt-8 mb-8 animate-slide-in-from-bottom-2">
              <GreenStatsCard
                co2Saved={user?.co2Saved || 0}
                greenPoints={user?.greenPoints || 0}
              />
            </div>
          )}

          <div className="animate-slide-in-from-bottom-4 mb-12">
            {userRole === 'driver' ? (
              <DriverDashboard />
            ) : (
              <RiderDashboard />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
