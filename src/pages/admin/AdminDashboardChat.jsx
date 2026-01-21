import { useEffect, useLayoutEffect, useRef, useState } from "react";
import apiClient from "../../../utils/axios";
import "../../../src/assets/css/AdminChatModal.css";

const AdminChatModal = ({ onClose }) => {
  const [requests, setRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Scroll to bottom when chatMessages change
  useLayoutEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 10);
  }, [chatMessages]);

  

  // ✅ FETCH USERS LIST
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/money-requests");
      const rows = res.data || [];

      const uniqueUsersMap = new Map();
      rows.forEach((row) => {
        const existing = uniqueUsersMap.get(row.user_id);
        if (!existing) {
          uniqueUsersMap.set(row.user_id, {
            user_id: row.user_id,
            full_name: row.full_name,
            phone: row.phone,
            count: 0,
            last_time: row.created_at,
          });
        } else {
          if (new Date(row.created_at) > new Date(existing.last_time)) {
            existing.last_time = row.created_at;
          }
        }
      });

      const uniqueUsers = Array.from(uniqueUsersMap.values());

      const usersWithMeta = await Promise.all(
        uniqueUsers.map(async (user) => {
          try {
            const chatRes = await apiClient.get(
              `/api/admin/money-requests/${user.user_id}/chat`
            );
            const messages = chatRes.data || [];

            const unreadCount = messages.filter(
              (msg) => msg.sender?.toLowerCase() === "user" && Number(msg.is_read) === 0
            ).length;

            const lastMessageTime =
              messages.length > 0 ? messages[messages.length - 1].created_at : user.last_time;

            return {
              ...user,
              count: unreadCount,
              last_time: lastMessageTime,
            };
          } catch (err) {
            console.error(err);
            return user;
          }
        })
      );

      usersWithMeta.sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
      setRequests(usersWithMeta);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH CHAT MESSAGES
  const fetchChatMessages = async (userId) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/money-requests/${userId}/chat`);
      setChatMessages(res.data || []);
    } catch (err) {
      console.error(err);
      setChatMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ USER CLICK
  const handleUserClick = async (user) => {
    setSelectedUser(user);

    await fetchChatMessages(user.user_id);

    setRequests((prev) =>
      prev.map((u) => (u.user_id === user.user_id ? { ...u, count: 0 } : u))
    );

    try {
      await apiClient.post("/api/admin/money-requests/chat/read", {
        request_id: user.user_id,
        role: "admin",
      });
      fetchRequests();
    } catch (err) {
      console.error("Mark read failed", err);
    }
  };

  // ✅ SEND MESSAGE
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const messagePayload = {
      request_id: selectedUser.user_id,
      sender: "admin",
      message: newMessage,
    };

    try {
      await apiClient.post("/api/user/money-requests/chat", messagePayload);

      // Optimistically append the message
      setChatMessages((prev) => [
        ...prev,
        {
          ...messagePayload,
          is_read: 1,
          created_at: new Date().toISOString(),
        },
      ]);

      setNewMessage("");

      // ❌ Removed fetchRequests() to prevent scroll jump
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setChatMessages([]);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ---------- HELPERS ----------
  const formatName = (name = "") =>
    name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const formatListTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  };

  // ---------- UI ----------
  return (
    <div className="modal-overlay">
      <div className="chat-modal">
        {/* Header */}
        <div className="chat-header">
          {selectedUser && (
            <button className="back-btn" onClick={handleBackToList}>
              ← Back
            </button>
          )}
          <h3>{selectedUser ? `Chat with ${selectedUser.full_name}` : "Money Request Users"}</h3>
        </div>

        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Body */}
        <div className="chat-body">
          {!selectedUser && (
            <div className="user-list">
              {loading ? (
                <p>Loading...</p>
              ) : requests.length === 0 ? (
                <p>No requests yet</p>
              ) : (
                requests.map((user) => (
                  <div key={user.user_id} className="user-item" onClick={() => handleUserClick(user)}>
                    <span className="user-name">{formatName(user.full_name)}</span>
                    <div className="user-meta">
                      {user.count > 0 && <span className="request-count">{user.count}</span>}
                      <span className="user-time">{formatListTime(user.last_time)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedUser && (
            <div className="chat-panel">
              <div className="chat-history">
                {loading ? (
                  <p>Loading chat...</p>
                ) : chatMessages.length === 0 ? (
                  <p>No messages yet</p>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isLast = idx === chatMessages.length - 1;
                    return (
                      <div
                        key={idx}
                        className={`chat-message ${msg.sender === "user" ? "user" : "admin"}`}
                        ref={isLast ? chatEndRef : null}
                      >
                        <span className="sender">{msg.sender === "user" ? selectedUser.full_name : "You"}:</span>
                        <span className="message">{msg.message}</span>
                        <span className="time">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="chat-input">
                <textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={onClose}>
                  Close
                </button>
                <button className="btn-primary" onClick={handleSendMessage}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatModal;
