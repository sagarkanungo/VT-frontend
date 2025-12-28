import { useEffect, useState } from "react";
import { getUserFromToken } from "../../../utils/auth";
import UsersTable from "./UsersTable";
import AdminMoneyRequests from "./AdminMoneyRequests";
import Analytics from "./Analytics";
import ChangeCredentials from "./ChangeCredentials";
import TimeControl from "./TimeControl";
import NotificationManager from "./NotificationManager";
import NotificationBadge from "../../components/NotificationBadge";
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
  FiBell
} from "react-icons/fi";

const AdminDashboard = () => {
  const user = getUserFromToken();
  const [activeSection, setActiveSection] = useState("users"); // "users", "requests", "analytics", "notifications", "timecontrol", or "credentials"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

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
        <h2>Admin Panel</h2>
      </div>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
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
            style={{ position: 'relative' }}
          >
            <FiDollarSign className="sidebar-icon" />
            <span>Money Requests</span>
            <NotificationBadge count={pendingRequestsCount} />
          </button>
          <button
            className={`sidebar-btn ${activeSection === "analytics" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("analytics")}
          >
            <FiBarChart2 className="sidebar-icon" />
            <span>Analytics</span>
          </button>
          <button
            className={`sidebar-btn ${activeSection === "notifications" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("notifications")}
          >
            <FiBell className="sidebar-icon" />
            <span>Notifications</span>
          </button>
          <button
            className={`sidebar-btn ${activeSection === "timecontrol" ? "active" : ""}`}
            onClick={() => handleSidebarItemClick("timecontrol")}
          >
            <FiClock className="sidebar-icon" />
            <span>Time Control</span>
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
        {activeSection === "requests" && <AdminMoneyRequests />}
        {activeSection === "analytics" && <Analytics />}
        {activeSection === "notifications" && <NotificationManager />}
        {activeSection === "timecontrol" && <TimeControl />}
        {activeSection === "credentials" && <ChangeCredentials />}
      </main>
    </div>
  );
};

export default AdminDashboard;
