import { useState, useEffect } from "react";
import apiClient from "../../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { 
  FiBell, 
  FiSend, 
  FiUsers, 
  FiUser,
  FiInfo,
  FiDollarSign,
  FiPlus,
  FiTrash2,
  FiEdit3
} from "react-icons/fi";
import "../../assets/css/notification-manager.css";

const NotificationManager = () => {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'news', // 'news', 'announcement', 'money_sent'
    title: '',
    message: '',
    recipients: 'all', // 'all', 'specific'
    selectedUsers: [],
    amount: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users');
      setUsers(response.data.filter(user => user.role !== 'admin'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/api/admin/notifications/history');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        message: formData.message,
        recipients: formData.recipients === 'all' ? null : formData.selectedUsers,
        amount: formData.type === 'money_sent' ? parseFloat(formData.amount) : null
      };

      await apiClient.post('/api/admin/notifications/send', payload);
      
      // Reset form
      setFormData({
        type: 'news',
        title: '',
        message: '',
        recipients: 'all',
        selectedUsers: [],
        amount: ''
      });

      // Refresh notifications history
      fetchNotifications();
      
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await apiClient.delete(`/api/admin/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error deleting notification.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'money_sent':
        return <FiDollarSign className="notification-type-icon money" />;
      case 'announcement':
        return <FiBell className="notification-type-icon announcement" />;
      case 'news':
      default:
        return <FiInfo className="notification-type-icon news" />;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="notification-manager">
      <div className="manager-header">
        <h2>
          <FiBell size={24} />
          Notification Manager
        </h2>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            <FiSend size={16} />
            Send Notification
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FiEdit3 size={16} />
            History ({notifications.length})
          </button>
        </div>
      </div>

      {activeTab === 'send' && (
        <div className="send-notification-section">
          <form onSubmit={handleSendNotification} className="notification-form">
            <div className="form-row">
              <div className="form-group">
                <label>Notification Type</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="news">News Update</option>
                  <option value="announcement">Important Announcement</option>
                  <option value="money_sent">Money Transfer Notification</option>
                </select>
              </div>

              <div className="form-group">
                <label>Recipients</label>
                <select 
                  name="recipients" 
                  value={formData.recipients} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="all">All Users</option>
                  <option value="specific">Specific Users</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter notification title"
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter notification message"
                rows="4"
                required
              />
            </div>

            {formData.type === 'money_sent' && (
              <div className="form-group">
                <label>Amount (Optional)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                />
              </div>
            )}

            {formData.recipients === 'specific' && (
              <div className="form-group">
                <label>Select Users ({formData.selectedUsers.length} selected)</label>
                <div className="users-selection">
                  {users.map(user => (
                    <div key={user.id} className="user-checkbox">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={formData.selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelection(user.id)}
                      />
                      <label htmlFor={`user-${user.id}`}>
                        <FiUser size={16} />
                        {user.full_name} ({user.email})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="send-btn"
                disabled={sending || (formData.recipients === 'specific' && formData.selectedUsers.length === 0)}
              >
                {sending ? (
                  <>
                    <LoadingSpinner size="small" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend size={16} />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="notifications-history">
          <div className="history-header">
            <h3>Sent Notifications</h3>
            <span className="total-count">{notifications.length} total</span>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <FiBell size={48} />
                <h4>No notifications sent yet</h4>
                <p>Start by sending your first notification to users.</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="notification-history-item">
                  <div className="notification-info">
                    <div className="notification-header">
                      {getNotificationIcon(notification.type)}
                      <div className="notification-details">
                        <h4>{notification.title}</h4>
                        <div className="notification-meta">
                          <span className="type-badge type-{notification.type}">
                            {notification.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="sent-time">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          <span className="recipient-count">
                            <FiUsers size={14} />
                            {notification.recipient_count} recipients
                          </span>
                        </div>
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
                    <button 
                      className="delete-btn"
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
      )}
    </div>
  );
};

export default NotificationManager;