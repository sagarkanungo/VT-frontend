import { useState } from "react";
import apiClient from "../../../utils/axios";
import { FiBell, FiSend, FiAlertCircle } from "react-icons/fi";

const AdminNotifications = () => {
  const [formData, setFormData] = useState({
    title: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Title and message are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiClient.post('/api/admin/send-announcement', {
        title: formData.title.trim(),
        message: formData.message.trim()
      });

      setSuccess(`Announcement sent to ${response.data.userCount} users successfully!`);
      setFormData({ title: "", message: "" });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (error) {
      console.error("Error sending announcement:", error);
      setError(error.response?.data?.error || "Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-notifications">
      <div className="page-header">
        <div className="header-content">
          <FiBell className="header-icon" />
          <div>
            <h1>Send Announcement</h1>
            <p>Send important notifications to all users</p>
          </div>
        </div>
      </div>

      <div className="notification-form-container">
        <form onSubmit={handleSubmit} className="notification-form">
          <div className="form-group">
            <label htmlFor="title">
              <FiAlertCircle className="label-icon" />
              Announcement Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter announcement title..."
              maxLength={100}
              disabled={loading}
            />
            <small className="char-count">{formData.title.length}/100</small>
          </div>

          <div className="form-group">
            <label htmlFor="message">
              <FiBell className="label-icon" />
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter your announcement message..."
              rows={6}
              maxLength={500}
              disabled={loading}
            />
            <small className="char-count">{formData.message.length}/500</small>
          </div>

          {error && (
            <div className="alert alert-error">
              <FiAlertCircle />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <FiBell />
              {success}
            </div>
          )}

          <button 
            type="submit" 
            className="send-btn"
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
          >
            <FiSend className="btn-icon" />
            {loading ? "Sending..." : "Send Announcement"}
          </button>
        </form>

        <div className="notification-preview">
          <h3>Preview</h3>
          <div className="preview-card">
            <div className="preview-header">
              <FiBell className="preview-icon" />
              <span className="preview-type">Announcement</span>
            </div>
            <div className="preview-content">
              <h4>{formData.title || "Your title will appear here"}</h4>
              <p>{formData.message || "Your message will appear here"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;