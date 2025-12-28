import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import { clearTimeSettingsCache, getTimeSettings } from "../../../utils/timeUtils";
import "../../assets/css/timecontrol.css";
import { FiClock, FiSave, FiToggleLeft, FiToggleRight } from "react-icons/fi";

const TimeControl = () => {
  const [timeSettings, setTimeSettings] = useState({
    enabled: false,
    startTime: "09:00",
    endTime: "15:00",
    timezone: "Asia/Kolkata"
  });
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTimeSettings();
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTimeSettings = async () => {
    try {
      // Admin can use the admin endpoint to fetch settings
      console.log('🔍 Admin fetching time settings...');
      const res = await apiClient.get("/api/time-settings");
      
      if (res.data) {
        setTimeSettings({
          enabled: res.data.enabled || false,
          startTime: res.data.startTime || "09:00",
          endTime: res.data.endTime || "15:00",
          timezone: res.data.timezone || "Asia/Kolkata"
        });
        console.log('✅ Admin loaded time settings:', res.data);
      }
    } catch (err) {
      console.error("❌ Admin failed to fetch time settings:", err);
      // Keep default values if everything fails
      setTimeSettings({
        enabled: false,
        startTime: "09:00",
        endTime: "15:00",
        timezone: "Asia/Kolkata"
      });
    }
  };

  const handleSave = async () => {
    console.log('🎯 Admin attempting to save time settings:', timeSettings);
    setLoading(true);
    try {
      console.log('🌐 Saving to API...');
await apiClient.post("/api/time-settings", timeSettings);
      clearTimeSettingsCache(); // Clear cache so changes take effect immediately
      console.log('✅ Successfully saved to API');
      alert("Time settings updated successfully!");
    } catch (err) {
      console.error('❌ Failed to save time settings:', err);
      alert("Failed to update time settings: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setTimeSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const handleTimeChange = (field, value) => {
    setTimeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isCurrentlyAllowed = () => {
    if (!timeSettings.enabled || !timeSettings.startTime || !timeSettings.endTime) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    try {
      const [startHour, startMinute] = timeSettings.startTime.split(':').map(Number);
      const [endHour, endMinute] = timeSettings.endTime.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
    } catch (error) {
      console.error('Error parsing time settings:', error);
      return true; // Allow transactions if there's an error parsing times
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timeSettings.timezone
    });
  };

  return (
    <div className="time-control-container">
      <div className="time-control-header">
        <h2>
          <FiClock className="header-icon" />
          Transaction Time Control
        </h2>
        <p>Set allowed transaction hours for users</p>
        {/* <div className="api-notice">
          <small>⚠️ Requires backend API endpoint: GET /api/time-settings (public) and POST /api/admin/time-settings (admin only)</small>
        </div> */}
      </div>

      <div className="current-status">
        <div className="status-card">
          <h3>Current Status</h3>
          <div className="status-info">
            <div className="current-time">
              <strong>Current Time: {formatTime(currentTime)}</strong>
            </div>
            <div className={`transaction-status ${isCurrentlyAllowed() ? 'allowed' : 'blocked'}`}>
              {isCurrentlyAllowed() ? '✅ Transactions Allowed' : '❌ Transactions Blocked'}
            </div>
          </div>
        </div>
      </div>

      <div className="time-settings-card">
        <div className="setting-row">
          <div className="setting-label">
            <h3>Enable Time Restrictions</h3>
            <p>When enabled, users can only make transactions during specified hours</p>
          </div>
          <button 
            className={`toggle-btn ${timeSettings.enabled ? 'enabled' : 'disabled'}`}
            onClick={handleToggle}
          >
            {timeSettings.enabled ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
            <span>{timeSettings.enabled ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>

        {timeSettings.enabled && (
          <div className="time-inputs">
            <div className="input-group">
              <label>Start Time</label>
              <input
                type="time"
                value={timeSettings.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>End Time</label>
              <input
                type="time"
                value={timeSettings.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="preview-section">
          <h4>Preview</h4>
          <div className="preview-info">
            {timeSettings.enabled && timeSettings.startTime && timeSettings.endTime ? (
              <p>
                Transactions will be allowed from <strong>{timeSettings.startTime}</strong> to <strong>{timeSettings.endTime}</strong> daily.
                <br />
                Outside these hours, all transaction features will be disabled for users.
              </p>
            ) : (
              <p>Time restrictions are disabled. Users can make transactions 24/7.</p>
            )}
          </div>
        </div>

        <button 
          className="save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          <FiSave className="btn-icon" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default TimeControl;