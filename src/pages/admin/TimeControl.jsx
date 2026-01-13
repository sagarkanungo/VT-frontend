import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import { clearTimeSettingsCache } from "../../../utils/timeUtils";
import "../../assets/css/timecontrol.css";
import { FiClock, FiSave, FiToggleLeft, FiToggleRight } from "react-icons/fi";

const TimeControl = () => {
  const [timeSettings, setTimeSettings] = useState({
    enabled: false,
    forceDisable: false,
    startTime: "09:00",
    endTime: "15:00",
    timezone: "Asia/Kolkata",
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
      const res = await apiClient.get("/api/time-settings");

      if (res.data) {
        setTimeSettings({
          enabled: res.data.enabled || false,
          forceDisable: res.data.forceDisable || false,
          startTime: res.data.startTime || "09:00",
          endTime: res.data.endTime || "15:00",
          timezone: res.data.timezone || "Asia/Kolkata",
        });
      }
    } catch (err) {
      console.error("Failed to fetch time settings:", err);
      setTimeSettings({
        enabled: false,
        forceDisable: false,
        startTime: "09:00",
        endTime: "15:00",
        timezone: "Asia/Kolkata",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiClient.post("/api/time-settings", timeSettings);
      clearTimeSettingsCache();
      alert("Time settings updated successfully!");
    } catch (err) {
      console.error("Failed to save time settings:", err);
      alert("Failed to update time settings: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = () => {
    setTimeSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const handleToggleForceDisable = () => {
    setTimeSettings(prev => ({
      ...prev,
      forceDisable: !prev.forceDisable
    }));
  };

  const handleTimeChange = (field, value) => {
    setTimeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isCurrentlyAllowed = () => {
    if (timeSettings.forceDisable) return false; // Force disable overrides everything
    if (!timeSettings.enabled || !timeSettings.startTime || !timeSettings.endTime) return true;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    try {
      const [startHour, startMinute] = timeSettings.startTime.split(":").map(Number);
      const [endHour, endMinute] = timeSettings.endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } catch {
      return true;
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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
      </div>

      {/* ================= CURRENT STATUS ================= */}
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

      {/* ================= SETTINGS ================= */}
      <div className="time-settings-card">
        {/* Enable/Disable Time Restriction */}
        <div className="setting-row">
          <div className="setting-label">
            <h3>Enable Time Restrictions</h3>
            <p>When enabled, users can only make transactions during specified hours</p>
          </div>
          <button
            className={`toggle-btn ${timeSettings.enabled ? 'enabled' : 'disabled'}`}
            onClick={handleToggleEnabled}
            disabled={timeSettings.forceDisable}
          >
            {timeSettings.enabled ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
            <span>{timeSettings.enabled ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>

        {/* Force Disable Toggle */}
        <div className="setting-row">
          <div className="setting-label">
            <h3>Force Disable All Transactions</h3>
            <p>When enabled, all transaction features are blocked, ignoring time restrictions</p>
          </div>
          <button
            className={`toggle-btn ${timeSettings.forceDisable ? 'enabled' : 'disabled'}`}
            onClick={handleToggleForceDisable}
          >
            {timeSettings.forceDisable ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
            <span>{timeSettings.forceDisable ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>

        {/* Time inputs */}
        {timeSettings.enabled && !timeSettings.forceDisable && (
          <div className="time-inputs">
            <div className="input-group">
              <label>Start Time</label>
              <input
                type="time"
                value={timeSettings.startTime}
                onChange={(e) => handleTimeChange("startTime", e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>End Time</label>
              <input
                type="time"
                value={timeSettings.endTime}
                onChange={(e) => handleTimeChange("endTime", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="preview-section">
          <h4>Preview</h4>
          <div className="preview-info">
            {timeSettings.forceDisable ? (
              <p>All transactions are currently blocked regardless of time.</p>
            ) : timeSettings.enabled && timeSettings.startTime && timeSettings.endTime ? (
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

        {/* Save Button */}
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
