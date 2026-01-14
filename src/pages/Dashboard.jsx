import { useState, useEffect } from "react";
import apiClient from "../../utils/axios";
import "../assets/css/dashboard.css";
import { getUserFromToken } from "../../utils/auth";
import { isTransactionAllowed } from "../../utils/timeUtils";
import logo from "../assets/css/logos.png";
import {
  FiHome,
  FiPlus,
  FiSend,
  FiClock,
  FiMessageCircle,
  FiLogOut,
  FiMenu,
  FiX,
  FiAlertCircle,
  FiBell,
  FiUsers,
  FiCopy,
  FiCheck,
  FiFileText,
} from "react-icons/fi";

import NewEntry from "./NewEntry";
import Transfer from "./Transfer";
import History from "./History";
import { AiFillBell } from "react-icons/ai";
import { MdPrivacyTip } from "react-icons/md";

function Dashboard() {
  const [showChat, setShowChat] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [totalBalance, setTotalBalance] = useState(0);
  const [activeSection, setActiveSection] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionAllowed, setTransactionAllowed] = useState(true);
  const [transactionMessage, setTransactionMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const user = getUserFromToken();
  "user", user;
  if (!user) window.location.href = "/login";

  const userId = user.id;
  const userName = user.full_name.toUpperCase();

  const fetchBalance = async () => {
    try {
      const res = await apiClient.get(`/api/user/${userId}/balance`);
      setTotalBalance(res.data.balance);
    } catch {
      setTotalBalance(0);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const checkTransactionStatus = async () => {
    try {
      const status = await isTransactionAllowed();
      setTransactionAllowed(status.allowed);
      setTransactionMessage(status.message);
    } catch (error) {
      console.error("Error checking transaction status:", error);
      setTransactionAllowed(true);
      setTransactionMessage("");
    }
  };

  useEffect(() => {
    fetchBalance();
    checkTransactionStatus();
    fetchNotifications();

    // Check transaction status every minute
    const interval = setInterval(() => {
      checkTransactionStatus();
    }, 60000);

    // Fetch notifications every 30 seconds
    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, [userId]);

  const handleSendRequest = async () => {
    if ( !message) return alert("Please enter amount and message");

    // Check if transactions are allowed
    const timeCheck = await isTransactionAllowed();
    if (!timeCheck.allowed) {
      alert(timeCheck.message);
      return;
    }

    try {
      await apiClient.post("/api/request-money", {
        user_id: userId,
        message: `${message}`,
      });
      alert("Request sent to admin");
      setAmount("");
      setMessage("");
      setShowChat(false);
    } catch (err) {
      alert("Failed to send request");
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

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get(`/api/notifications/${userId}`);
      setNotifications(res.data);

      const unread = res.data.filter((n) => n.is_read === 0).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "newEntry":
        return <NewEntry onEntrySuccess={fetchBalance} />;
      case "transfer":
        return <Transfer onTransferSuccess={fetchBalance} />;
      case "history":
        return <History />;
      case "referral":
        return (
          <div className="referral-section">
            <div className="referral-header">
              <h2>Share Breetta</h2>
              <p>Invite your friends to join Breetta!</p>
            </div>

            {/* App Info */}
            <div className="app-info-card">
              <div className="app-icon">💸</div>
              <div className="app-details">
                <h3>Breetta</h3>
                <p>The best app for managing your transactions and entries</p>
              </div>
            </div>

            {/* Share Message */}
            <div className="share-message-section">
              <h3>Share Message</h3>
              <div className="message-container">
                <textarea
                  value="Hey! Check out Breetta - it's amazing for managing transactions and entries. Download it now!"
                  readOnly
                  className="share-message-input"
                  rows="3"
                />
                <button
                  className="copy-btn"
                  onClick={() =>
                    copyToClipboard(
                      "Hey! Check out Breetta - it's amazing for managing transactions and entries. Download it now!"
                    )
                  }
                >
                  {copySuccess ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="share-buttons">
              <h3>Share Now</h3>
              <div className="share-options">
                <button
                  className="share-btn whatsapp"
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=Hey! Check out Breetta - it's amazing for managing transactions and entries. Download it now!`,
                      "_blank"
                    )
                  }
                >
                  📱 WhatsApp
                </button>
                <button
                  className="share-btn telegram"
                  onClick={() =>
                    window.open(
                      `https://t.me/share/url?text=Hey! Check out Breetta - it's amazing for managing transactions and entries. Download it now!`,
                      "_blank"
                    )
                  }
                >
                  ✈️ Telegram
                </button>
                <button
                  className="share-btn facebook"
                  onClick={() =>
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}&quote=Hey! Check out Breetta - it's amazing for managing transactions and entries.`,
                      "_blank"
                    )
                  }
                >
                  📘 Facebook
                </button>
                <button
                  className="share-btn twitter"
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=Hey! Check out Breetta - it's amazing for managing transactions and entries. Download it now!`,
                      "_blank"
                    )
                  }
                >
                  🐦 Twitter
                </button>
                <button
                  className="share-btn copy"
                  onClick={() =>
                    copyToClipboard(
                      "Hey! Check out Breetta - it's amazing for managing transactions and entries. Download it now!"
                    )
                  }
                >
                  📋 Copy Message
                </button>
              </div>
            </div>

            {/* Why Share */}
            <div className="why-share">
              <h3>Why Share Breetta?</h3>
              <div className="benefits">
                <div className="benefit">
                  <div className="benefit-icon">✨</div>
                  <div className="benefit-content">
                    <h4>Easy to Use</h4>
                    <p>Simple and intuitive interface for everyone</p>
                  </div>
                </div>
                <div className="benefit">
                  <div className="benefit-icon">🔒</div>
                  <div className="benefit-content">
                    <h4>Secure</h4>
                    <p>Your data and transactions are completely safe</p>
                  </div>
                </div>
                <div className="benefit">
                  <div className="benefit-icon">⚡</div>
                  <div className="benefit-content">
                    <h4>Fast</h4>
                    <p>Quick transactions and instant updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <>
            {/* Transaction Status Banner */}
            {!transactionAllowed && (
              <div className="transaction-status-banner">
                <FiAlertCircle className="status-icon" />
                <div className="status-content">
                  <h4>Transactions Currently Unavailable</h4>
                  <p>{transactionMessage}</p>
                </div>
              </div>
            )}

            <div className="card balance-card">
              <h3>Total Balance</h3>
              <p>{totalBalance.toLocaleString() || 1000}</p>
            </div>

            <div
              className={`card new-entry-card ${
                !transactionAllowed ? "disabled" : ""
              }`}
              onClick={() => transactionAllowed && setActiveSection("newEntry")}
            >
              <h3>New Entry</h3>
              <button className="btn-primary" disabled={!transactionAllowed}>
                + Add New Transaction
              </button>
            </div>

            <div className="dashboard-row">
              <div
                className={`card transfer-card ${
                  !transactionAllowed ? "disabled" : ""
                }`}
                onClick={() =>
                  transactionAllowed && setActiveSection("transfer")
                }
              >
                <h3>Transfer</h3>
                <div className="icon">💸</div>
                <button
                  className="btn-secondary"
                  disabled={!transactionAllowed}
                >
                  Send Money
                </button>
              </div>

              <div
                className="card history-card"
                onClick={() => setActiveSection("history")}
              >
                <h3>History</h3>
                <div className="icon">📝</div>
                <button className="btn-secondary">View Transactions</button>
              </div>
            </div>
          </>
        );
    }
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
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Breetta Logo" className="sidebar-logo" />
          <p>Welcome, {userName}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-btn ${activeSection === null ? "active" : ""}`}
            onClick={() => handleSidebarItemClick(null)}
          >
            <FiHome className="sidebar-icon" />
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeSection === "newEntry" ? "active" : ""
            }`}
            onClick={() => handleSidebarItemClick("newEntry")}
          >
            <FiPlus className="sidebar-icon" />
            <span>New Entry</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeSection === "transfer" ? "active" : ""
            }`}
            onClick={() => handleSidebarItemClick("transfer")}
          >
            <FiSend className="sidebar-icon" />
            <span>Transfer</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeSection === "history" ? "active" : ""
            }`}
            onClick={() => handleSidebarItemClick("history")}
          >
            <FiClock className="sidebar-icon" />
            <span>History</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeSection === "referral" ? "active" : ""
            }`}
            onClick={() => handleSidebarItemClick("referral")}
          >
            <FiUsers className="sidebar-icon" />
            <span>Referral & Share App</span>
          </button>

          <button
            className="sidebar-btn"
            onClick={() => {
              if (transactionAllowed) {
                setShowChat(true);
                setSidebarOpen(false);
              } else {
                alert(transactionMessage);
              }
            }}
            disabled={!transactionAllowed}
          >
            <FiMessageCircle className="sidebar-icon" />
            <span>Chat</span>
          </button>
          <button
            className="sidebar-btn notification-btn"
            onClick={() => {
              setShowNotifications(true);
              setSidebarOpen(false);
            }}
          >
            <AiFillBell className="sidebar-icon" />
            <span>Notifications</span>

            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          <button
            className="sidebar-btn"
            onClick={() => window.open("/privacy-policy", "_blank")}
          >
            <MdPrivacyTip className="sidebar-icon" />
            <span>Privacy Policy</span>
          </button>

          <button
            className="sidebar-btn"
            onClick={() => window.open("/terms-and-conditions", "_blank")}
          >
            <FiFileText className="sidebar-icon" />
            <span>Terms & Conditions</span>
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut className="sidebar-icon" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main */}
      <main className="dashboard-main">{renderSection()}</main>

      {/* Chat Modal */}
      {showChat && (
        <div className="modal-overlay">
          <div className="chat-modal">
            <h3>Request Money</h3>
            {/* <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            /> */}
            <textarea
              placeholder="Enter message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowChat(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSendRequest}>
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="modal-overlay">
          <div className="notification-modal">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>✕</button>
            </div>

            {notifications.length === 0 ? (
              <p className="empty-text">No notifications</p>
            ) : (
              <div className="notification-list">
                {notifications.map((n) => {
                  const data = n.data ? JSON.parse(n.data) : {};
                  const isAnnouncement = n.type === "announcement";

                  return (
                    <div
                      key={n.id}
                      className={`notification-item ${
                        n.is_read ? "read" : "unread"
                      } ${isAnnouncement ? "announcement" : ""}`}
                      onClick={() => {
                        if (!n.is_read) markNotificationRead(n.id);
                      }}
                    >
                      <div className="notification-content">
                        {isAnnouncement && (
                          <div className="notification-type">
                            <FiBell className="type-icon" />
                            <span>Announcement</span>
                          </div>
                        )}
                        {data.title && (
                          <h4 className="notification-title">{data.title}</h4>
                        )}
                        <p className="notification-message">{n.message}</p>
                        <span className="notification-time">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      {!n.is_read && <div className="unread-dot"></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
