import { useState, useEffect } from "react";
import apiClient from "../../utils/axios";
import "../assets/css/dashboard.css";
import { getUserFromToken } from "../../utils/auth";
import { isTransactionAllowed } from "../../utils/timeUtils";
import { 
  FiHome, 
  FiPlus, 
  FiSend, 
  FiClock, 
  FiMessageCircle, 
  FiLogOut,
  FiMenu,
  FiX,
  FiAlertCircle
} from "react-icons/fi";

import NewEntry from "./NewEntry";
import Transfer from "./Transfer";
import History from "./History";

function Dashboard() {
  const [showChat, setShowChat] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [totalBalance, setTotalBalance] = useState(0);
  const [activeSection, setActiveSection] = useState(null); // null, 'newEntry', 'transfer', 'history'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionAllowed, setTransactionAllowed] = useState(true);
  const [transactionMessage, setTransactionMessage] = useState('');

  const user = getUserFromToken();
  console.log('user',user)
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

const checkTransactionStatus = async () => {
  try {
    const status = await isTransactionAllowed();
    setTransactionAllowed(status.allowed);
    setTransactionMessage(status.message);
  } catch (error) {
    console.error('Error checking transaction status:', error);
    setTransactionAllowed(true);
    setTransactionMessage('');
  }
};

useEffect(() => {
  fetchBalance();
  checkTransactionStatus();
  
  // Check transaction status every minute
  const interval = setInterval(checkTransactionStatus, 60000);
  return () => clearInterval(interval);
}, [userId]);


  const handleSendRequest = async () => {
    if (!amount || !message) return alert("Please enter amount and message");

    // Check if transactions are allowed
    const timeCheck = await isTransactionAllowed();
    if (!timeCheck.allowed) {
      alert(timeCheck.message);
      return;
    }

    try {
      await apiClient.post("/api/request-money", {
        user_id: userId,
        message: `₹${amount} - ${message}`,
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

  const renderSection = () => {
    switch (activeSection) {
      case "newEntry":
        return <NewEntry />;
      case "transfer":
        return <Transfer onTransferSuccess={fetchBalance}  />;
      case "history":
        return <History />;
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
              <p>₹{totalBalance.toLocaleString() || 1000}</p>
            </div>

            <div
              className={`card new-entry-card ${!transactionAllowed ? 'disabled' : ''}`}
              onClick={() => transactionAllowed && setActiveSection("newEntry")}
            >
              <h3>New Entry</h3>
              <button 
                className="btn-primary" 
                disabled={!transactionAllowed}
              >
                + Add New Transaction
              </button>
            </div>

            <div className="dashboard-row">
              <div
                className={`card transfer-card ${!transactionAllowed ? 'disabled' : ''}`}
                onClick={() => transactionAllowed && setActiveSection("transfer")}
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
        <h2>💸 VT App</h2>
      </div>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>💸 VT App</h2>
          <p>Welcome, {userName}</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-btn ${activeSection === null ? 'active' : ''}`} 
            onClick={() => handleSidebarItemClick(null)}
          >
            <FiHome className="sidebar-icon" />
            <span>Dashboard</span>
          </button>
          <button 
            className={`sidebar-btn ${activeSection === 'newEntry' ? 'active' : ''}`} 
            onClick={() => handleSidebarItemClick("newEntry")}
          >
            <FiPlus className="sidebar-icon" />
            <span>New Entry</span>
          </button>
          <button 
            className={`sidebar-btn ${activeSection === 'transfer' ? 'active' : ''}`} 
            onClick={() => handleSidebarItemClick("transfer")}
          >
            <FiSend className="sidebar-icon" />
            <span>Transfer</span>
          </button>
          <button 
            className={`sidebar-btn ${activeSection === 'history' ? 'active' : ''}`} 
            onClick={() => handleSidebarItemClick("history")}
          >
            <FiClock className="sidebar-icon" />
            <span>History</span>
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
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <textarea
              placeholder="Enter message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowChat(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSendRequest}>
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
