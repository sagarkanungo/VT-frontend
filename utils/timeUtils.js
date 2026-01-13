import apiClient from './axios';

// Cache for time settings to avoid frequent API calls
let timeSettingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getTimeSettings = async () => {
  const now = Date.now();

  // Return cached data if it's still valid
  if (timeSettingsCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
    ('📋 Using cached time settings:', timeSettingsCache);
    return timeSettingsCache;
  }

  try {
    ('🌐 Fetching time settings from public API...');
    const res = await apiClient.get('/api/time-settings');

    if (res.data && typeof res.data === 'object') {
      // Ensure all keys exist
      timeSettingsCache = {
        enabled: !!res.data.enabled,
        forceDisable: !!res.data.forceDisable, // NEW
        startTime: res.data.startTime || '09:00',
        endTime: res.data.endTime || '15:00',
        timezone: res.data.timezone || 'Asia/Kolkata'
      };
      cacheTimestamp = now;
      ('✅ Successfully loaded time settings from API:', timeSettingsCache);
      return timeSettingsCache;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('❌ Failed to fetch time settings from API:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });

    // Return default settings if API fails
    const defaultSettings = { enabled: false, forceDisable: false, startTime: '09:00', endTime: '15:00', timezone: 'Asia/Kolkata' };
    ('📋 Using default time settings (API failed):', defaultSettings);
    return defaultSettings;
  }
};

export const isTransactionAllowed = async () => {
  try {
    const settings = await getTimeSettings();
    ('🔍 Current time settings:', settings);

    // If forceDisable is ON, block all transactions immediately
    if (settings.forceDisable) {
      ('❌ FORCE DISABLE ACTIVE - Blocking all transactions');
      return {
        allowed: false,
        message: 'All transactions are currently disabled by admin.'
      };
    }

    // If time restrictions are disabled, allow all transactions
    if (!settings.enabled || !settings.startTime || !settings.endTime) {
      ('✅ Time restrictions disabled or invalid settings - ALLOWING transactions');
      return { allowed: true, message: '' };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    (`⏰ Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} minutes from midnight)`);

    try {
      const [startHour, startMinute] = settings.startTime.split(':').map(Number);
      const [endHour, endMinute] = settings.endTime.split(':').map(Number);

      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      (`📅 Allowed time window: ${settings.startTime} to ${settings.endTime} (${startTimeInMinutes} to ${endTimeInMinutes} minutes)`);

      const isAllowed = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;

      if (isAllowed) {
        ('✅ TRANSACTION ALLOWED - Current time is within allowed window');
        return { allowed: true, message: '' };
      } else {
        ('❌ TRANSACTION BLOCKED - Current time is outside allowed window');
        const startTime12 = formatTime12Hour(settings.startTime);
        const endTime12 = formatTime12Hour(settings.endTime);
        return {
          allowed: false,
          message: `Transactions are only allowed between ${startTime12} and ${endTime12}. Please try again during allowed hours.`
        };
      }
    } catch (parseError) {
      console.error('Error parsing time settings:', parseError);
      // Allow transactions if there's an error parsing times
      return { allowed: true, message: '' };
    }
  } catch (error) {
    console.error('Error checking transaction time:', error);
    // Allow transactions if there's an error checking time
    return { allowed: true, message: '' };
  }
};

export const formatTime12Hour = (time24) => {
  if (!time24 || typeof time24 !== 'string') {
    return '12:00 AM';
  }

  try {
    const [hoursStr, minutes] = time24.split(':');
    const hours = Number(hoursStr);
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '12:00 AM';
  }
};

export const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Clear cache when settings are updated
export const clearTimeSettingsCache = () => {
  timeSettingsCache = null;
  cacheTimestamp = null;
  ('🧹 Cleared time settings cache');
};
