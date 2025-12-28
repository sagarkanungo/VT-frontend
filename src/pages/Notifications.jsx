import { useState, useEffect } from "react";
import apiClient from "../../utils/axios";
import { getUserFromToken } from "../../utils/auth";
import LoadingSpinner from "../components/LoadingSpinner";
import { 
  FiBell, 
  FiDollarSign, 
  FiInfo, 
  FiCheck, 
  FiX,
  FiEye,
  FiTrash2
} from "react-icons/fi";
import "../assets/css/notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'money', 'news'
  const user = getUserFromToken();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/api/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'money_sent':
      case 'money_received':
        return <FiDollarSign className="notification-icon money" />;
      case 'news':
      case 'announcement':
        return <FiInfo className="notification-icon news" />;
      default:
        return <FiBell className="notification-icon default" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'money') return ['money_sent', 'money_received'].includes(notif.type);
    if (filter === 'news') return ['news', 'announcement'].includes(notif.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-title">
          <FiBell size={24} />
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount}</span>
          )}
        </div>
        
        <div className="header-actions">
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-btn"
              onClick={markAllAsRead}
            >
              <FiCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="notifications-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={`filter-btn ${filter === 'money' ? 'active' : ''}`}
          onClick={() => setFilter('money')}
        >
          Money ({notifications.filter(n => ['money_sent', 'money_received'].includes(n.type)).length})
        </button>
        <button 
          className={`filter-btn ${filter === 'news' ? 'active' : ''}`}
          onClick={() => setFilter('news')}
        >
          News ({notifications.filter(n => ['news', 'announcement'].includes(n.type)).length})
        </button>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications">
            <FiBell size={48} />
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-content">
                <div className="notification-header">
                  {getNotificationIcon(notification.type)}
                  <div className="notification-meta">
                    <h4>{notification.title}</h4>
                    <span className="notification-time">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                {notification.amount && (
                  <div className="notification-amount">
                    Amount: ${notification.amount}
                  </div>
                )}
              </div>

              <div className="notification-actions">
                {!notification.is_read && (
                  <button 
                    className="action-btn read-btn"
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <FiEye size={16} />
                  </button>
                )}
                <button 
                  className="action-btn delete-btn"
                  onClick={() => deleteNotification(notification.id)}
                  title="Delete notification"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;