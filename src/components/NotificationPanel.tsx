import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { notificationApi, Notification } from '../services/notifications';
import { useApp } from '../context/AppContext';
import Button from './Button';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationPanel({ isOpen, onClose, onNotificationClick }: NotificationPanelProps) {
  const { navigateTo, setActiveRideId } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.list();
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    if (notification.rideId) {
      // Ensure rideId is a string (handle both string and object cases)
      const rideIdString = typeof notification.rideId === 'string' 
        ? notification.rideId 
        : (notification.rideId as any)?._id?.toString() || (notification.rideId as any)?.toString();
      
      if (rideIdString) {
        setActiveRideId(rideIdString);
        navigateTo('ride-details');
        onClose();
      } else {
        console.error('Invalid rideId in notification:', notification.rideId);
      }
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ride_request':
        return '🔔';
      case 'request_accepted':
        return '✅';
      case 'request_rejected':
        return '❌';
      case 'request_cancelled':
        return '🚫';
      case 'ride_started':
        return '🚗';
      case 'ride_completed':
        return '🏁';
      default:
        return '📢';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border-4 border-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <Bell size={24} />
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.isRead) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck size={14} className="mr-1" />
                Mark all read
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

