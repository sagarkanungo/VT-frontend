import { useEffect, useState } from "react";
import { getUserFromToken } from "../../../utils/auth";
import UsersTable from "./UsersTable";
import AdminMoneyRequests from "./AdminMoneyRequests";
import Analytics from "./Analytics";
import ChangeCredentials from "./ChangeCredentials";
import TimeControl from "./TimeControl";
import logo from "../../assets/css/logos.png";
import AdminNotifications from "./AdminNotifications";

import apiClient from "../../../utils/axios";
import { 
  FiUsers, 
  FiDollarSign, 
  FiLogOut,
  FiMenu,
  FiX,
  FiBarChart2,
  FiSettings,
  FiClock,
  FiBell,
  FiMessageCircle
} from "react-icons/fi";
import AdminDashboardChat from "./AdminDashboardChat";

const AdminDashboard = () => {
  const user = getUserFromToken();
  
  const userId = user.id;
  console.log('userId',userId)
  const [activeSection, setActiveSection] = useState("users"); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false); // separate from showChat
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchAdminUnreadCount = async () => {
    try {
      const res = await apiClient.get("/api/admin/money-requests");
      const rows = res.data || [];
  
      // remove duplicates
      const uniqueUsersMap = new Map();
      rows.forEach((row) => {
        if (!uniqueUsersMap.has(row.user_id)) {
          uniqueUsersMap.set(row.user_id, { user_id: row.user_id, count: 0 });
        }
      });
      const uniqueUsers = Array.from(uniqueUsersMap.values());
  
      // get unread count per user
      const usersWithUnread = await Promise.all(
        uniqueUsers.map(async (user) => {
          try {
            const chatRes = await apiClient.get(
              `/api/admin/money-requests/${user.user_id}/chat`
            );
            const messages = chatRes.data || [];
            const unreadCount = messages.filter(
              (msg) => msg.sender === "user" && Number(msg.is_read) === 0
            ).length;
            return { ...user, count: unreadCount };
          } catch (err) {
            return { ...user, count: 0 };
          }
        })
      );
  
      // sum of unread messages from all users
      const totalUnread = usersWithUnread.reduce((acc, user) => acc + user.count, 0);
  
      setUnreadChatCount(totalUnread);
    } catch (err) {
      console.error(err);
      setUnreadChatCount(0);
    }
  };
  

 

  useEffect(() => {
    if (!showChatModal) return;
  
    const openChat = async () => {
      // 1️⃣ hide badge immediately
      setUnreadChatCount(0);
  
      // 2️⃣ mark messages read in DB
      await apiClient.post("/api/user/money-requests/chat/read", {
        request_id: userId,
        role: "admin",
      });
  
      // 3️⃣ fetch messages for modal
      fetchChatMessages();
    };
  
    openChat();
  }, [showChatModal]);
  

  useEffect(() => {
    fetchAdminUnreadCount(); // on page load
    const interval = setInterval(fetchAdminUnreadCount, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);
  

  useEffect(() => {
    if (!user) window.location.href = "/login";
    if (user.role !== "admin") window.location.href = "/dashboard";
    
    fetchPendingRequestsCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingRequestsCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchPendingRequestsCount = async () => {
    try {
      const response = await apiClient.get('/api/admin/money-requests/count');
      setPendingRequestsCount(response.data.pendingCount);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarItemClick = (section) => {
    setActiveSection(section);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Header with Hamburger */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <img src={logo} alt="Breetta Logo" className="mobile-logo" />
        </div>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
        <img src={logo} alt="Breetta Logo" className="sidebar-logo" />
        <p>Welcome, {user?.full_name}</p>
        </div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-btn ${activeSection === "users" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("users")}
          >
            <FiUsers className="sidebar-icon" />
            <span>Users</span>
          </button>
          <button
            className={`sidebar-btn ${activeSection === "requests" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("requests")}
          >
            <FiDollarSign className="sidebar-icon" />
            <span>Money Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="request-count-badge">{pendingRequestsCount}</span>
            )}
          </button>
          <button
            className={`sidebar-btn ${activeSection === "analytics" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("analytics")}
          >
            <FiBarChart2 className="sidebar-icon" />
            <span>Analytics</span>
          </button>
         
          <button
            className={`sidebar-btn ${activeSection === "timecontrol" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("timecontrol")}
          >
            <FiClock className="sidebar-icon" />
            <span>Time Control</span>
          </button>
          <button
            className={`sidebar-btn ${activeSection === "notifications" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("notifications")}
          >
            <FiBell className="sidebar-icon" />
            <span>Send Announcement</span>
          </button>
          <button
            className="sidebar-btn"
            onClick={() => {
              setShowChatModal(true);
              setSidebarOpen(false);
              // fetchChatMessages(); // load chat history
              // setUnreadChatCount(0);
            }}
          >
            <FiMessageCircle className="sidebar-icon" />
            <span>Chat</span>

            {unreadChatCount > 0 && (
              <span className="notification-badge">{unreadChatCount}</span>
            )}
          </button>
          <button
            className={`sidebar-btn ${activeSection === "credentials" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("credentials")}
          >
            <FiSettings className="sidebar-icon" />
            <span>Change Credentials</span>
          </button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut className="sidebar-icon" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {activeSection === "users" && <UsersTable />}
        {activeSection === "requests" && <AdminMoneyRequests onRequestUpdate={fetchPendingRequestsCount} />}
        {activeSection === "analytics" && <Analytics />}
        {activeSection === "timecontrol" && <TimeControl />}
        {activeSection === "notifications" && <AdminNotifications />}
        {activeSection === "credentials" && <ChangeCredentials />}
      </main>
      {showChatModal && (
        <AdminDashboardChat
          userId={userId}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
