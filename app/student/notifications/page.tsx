'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/student/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/student/notifications/${id}/read`, { method: 'POST' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-300 text-green-800';
      case 'warning': return 'bg-secondary-50 border-secondary-300 text-secondary-800';
      case 'error': return 'bg-accent-50 border-accent-300 text-accent-800';
      default: return 'bg-soft-200 border-soft-400 text-dark-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return 'ℹ';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-dark-700 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-200">
      {/* Gradient Ribbon Header */}
      <div className="gradient-ribbon h-2"></div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-soft-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h2 text-primary-500 font-semibold">Notifications</h1>
              <p className="text-label text-dark-600 mt-1">Stay updated with your clearance progress</p>
            </div>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="btn-accent"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card glow-on-hover border-l-4 border-secondary-500">
            <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Total</p>
            <p className="text-h1 text-dark-900 font-bold mt-2">{notifications.length}</p>
          </div>
          <div className="card glow-on-hover border-l-4 border-accent-500">
            <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Unread</p>
            <p className="text-h1 text-accent-600 font-bold mt-2">
              {notifications.filter(n => !n.read).length}
            </p>
          </div>
          <div className="card glow-on-hover border-l-4 border-green-500">
            <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Read</p>
            <p className="text-h1 text-green-600 font-bold mt-2">
              {notifications.filter(n => n.read).length}
            </p>
          </div>
        </div>

        {/* Notifications List */}
        <div className="card">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-soft-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔔</span>
              </div>
              <h3 className="text-body font-semibold text-dark-900">No notifications yet</h3>
              <p className="mt-2 text-label text-dark-600">
                You'll receive notifications about your clearance progress here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-soft-400">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-soft-100 transition-all duration-120 ${!notification.read ? 'bg-secondary-50' : ''
                    }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${getTypeStyles(notification.type)}`}>
                      <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-dark-900 text-body">
                            {notification.title}
                          </h3>
                          <p className="text-label text-dark-700 mt-1">{notification.message}</p>
                          <p className="text-label-sm text-dark-500 mt-2 font-mono">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="px-3 py-1 bg-secondary-500 text-white rounded-full text-label-sm font-semibold">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Gradient */}
      <div className="gradient-ribbon h-2 mt-12"></div>
    </div>
  );
}
