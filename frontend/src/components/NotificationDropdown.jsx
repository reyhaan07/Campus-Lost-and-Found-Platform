import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data.notifications || []);
      } catch (error) {
        setNotifications([]);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleToggle = () => setOpen((prev) => !prev);

  const markRead = async (notification) => {
    try {
      if (!notification.isRead) await api.put(`/notifications/${notification._id}/read`);
      setNotifications((prev) => prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
      setOpen(false);
      const reportId = notification.reportId?._id || notification.reportId;
      if (reportId) navigate(`/report/${reportId}`);
    } catch (error) {
      // Keep the notification visible so the user can retry.
    }
  };

  return (
    <div className="relative">
      <button type="button" className="relative rounded-full border px-3 py-2 text-sm" onClick={handleToggle}>
        Notifications
        {unreadCount > 0 && <span className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border bg-white p-4 shadow-lg">
          <h3 className="mb-3 text-sm font-semibold">Recent Notifications</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <button key={notification._id} type="button" className={`block w-full rounded-xl p-3 text-left ${notification.isRead ? 'bg-slate-50' : 'bg-slate-100'}`} onClick={() => markRead(notification)}>
                  <p className="text-sm">{notification.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
