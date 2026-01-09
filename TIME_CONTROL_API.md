# Time Control API Implementation Guide

This document outlines the backend API endpoints needed to support the transaction time control feature.

## Required API Endpoints

### 1. Get Time Settings (Public - All Users)
**GET** `/api/time-settings`

**Headers:**
```
Authorization: Bearer <any_valid_token>
```

**Response:**
```json
{
  "enabled": true,
  "startTime": "09:00",
  "endTime": "15:00",
  "timezone": "Asia/Kolkata"
}
```

### 2. Get Time Settings (Admin Only)
**GET** `/api/admin/time-settings`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** Same as above

### 3. Update Time Settings (Admin Only)
**POST** `/api/admin/time-settings`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "enabled": true,
  "startTime": "09:00",
  "endTime": "15:00",
  "timezone": "Asia/Kolkata"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Time settings updated successfully"
}
```

## Backend Implementation

### Files to Create/Modify:

#### 1. Create `middleware/authenticateUser.js`:
```javascript
const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authenticateUser;
```

#### 2. Create `routes/timeSettings.routes.js`:
```javascript
const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authenticateUser");
const { getTimeSettings } = require("../controllers/timeSettings.controller");

// Public endpoint for all authenticated users to read time settings
router.get("/time-settings", authenticateUser, getTimeSettings);

module.exports = router;
```

#### 3. Update your server file:
```javascript
// API routes
app.use('/api', authRoutes);
app.use("/api", require("./routes/money.routes"));
app.use("/api", entriesRoutes);
app.use("/api", require("./routes/transfer.routes"));
app.use("/api", usersRoutes);
app.use("/api", require("./routes/timeSettings.routes")); // Add this line
app.use("/api/admin", require("./routes/admin.routes"));
```

## How It Works

1. **Admin sets time restrictions** using `/api/admin/time-settings` (POST)
2. **All users read settings** using `/api/time-settings` (GET)
3. **Frontend checks time** and blocks transactions outside allowed hours
4. **Real-time updates** when admin changes settings

## Database Schema

Your existing `time_settings` table structure is perfect:
```sql
CREATE TABLE time_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enabled BOOLEAN DEFAULT FALSE,
  start_time TIME DEFAULT '00:00:00',
  end_time TIME DEFAULT '23:59:59',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
```

## How It Works

1. **Admin Configuration**: Admin sets allowed transaction hours (e.g., 9 AM to 3 PM)
2. **Real-time Checking**: Frontend checks transaction status every minute
3. **Transaction Blocking**: When outside allowed hours:
   - Transfer component shows blocked message
   - New Entry component shows blocked message
   - Dashboard disables transaction buttons
   - Request money feature is disabled
4. **Automatic Updates**: When time restrictions change, users see updates within 5 minutes (cache duration)

## Features Implemented

✅ **Admin Time Control Panel**
- Enable/disable time restrictions
- Set start and end times
- Real-time preview of current status
- Visual indicators for allowed/blocked periods

✅ **User Transaction Protection**
- TransactionGuard component wraps transaction features
- Real-time status checking
- Automatic UI updates when restrictions change
- Clear messaging about allowed hours

✅ **Dashboard Integration**
- Status banner when transactions are blocked
- Disabled buttons during restricted hours
- Real-time time display

✅ **Performance Optimized**
- Caching to reduce API calls
- Automatic cache clearing when settings change
- Minimal impact on user experience

## Testing

1. Set time restrictions in Breetta
2. Verify transactions are blocked outside allowed hours
3. Test that transactions work during allowed hours
4. Confirm real-time updates when crossing time boundaries
5. Test cache clearing when admin updates settings