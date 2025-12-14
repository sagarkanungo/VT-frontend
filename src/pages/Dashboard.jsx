import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/css/dashboard.css";

function Dashboard() {
  const userId = 1; // Replace with dynamic logged-in user id
  const [balance, setBalance] = useState(0);
  const [chatMessage, setChatMessage] = useState("");

  // Fetch balance
  const fetchBalance = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/user/${userId}/balance`);
      setBalance(res.data.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // Request money to admin
  const handleRequestMoney = async (e) => {
    e.preventDefault();
    if (!chatMessage) return alert("Enter a message");
    try {
      const res = await axios.post("http://localhost:5000/api/request-money", {
        user_id: userId,
        message: chatMessage
      });
      alert(res.data.message);
      setChatMessage("");
    } catch (err) {
      alert(err.response?.data?.error || "Request failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>💸 VT App</h2>
          <p>Welcome, Sagar</p>
        </div>
        <nav className="sidebar-nav">
          <button className="sidebar-btn">Dashboard</button>
          <button className="sidebar-btn">New Entry</button>
          <button className="sidebar-btn">Transfer</button>
          <button className="sidebar-btn">History</button>
          <button className="sidebar-btn">Chat</button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Total Balance */}
        <div className="card balance-card">
          <h3>Total Balance</h3>
          <p>₹{balance.toLocaleString()}</p>
        </div>

        {/* Request Money / Chat */}
        <div className="card chat-card">
          <h3>Request Money / Chat with Admin</h3>
          <form onSubmit={handleRequestMoney}>
            <textarea
              placeholder="Enter your message"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
            ></textarea>
            <button type="submit" className="btn-primary">Send Request</button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
