import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import "../../assets/css/credentials.css";
import { FiEdit2, FiSave, FiX, FiUser, FiPhone, FiLock } from "react-icons/fi";

const ChangeCredentials = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    password: ""
  });
  const [originalData, setOriginalData] = useState({});
  const token = localStorage.getItem("token");

  // Fetch admin data
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/users");

      // Find admin user
      const adminUser = res.data.find((u) => u.role === "admin");
      if (adminUser) {
        setAdmin(adminUser);
        setFormData({
          full_name: adminUser.full_name,
          phone: adminUser.phone,
          password: adminUser.password
        });
        setOriginalData({
          full_name: adminUser.full_name,
          phone: adminUser.phone,
          password: adminUser.password
        });
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
      alert("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.full_name.trim() || !formData.phone.trim() || !formData.password.trim()) {
        alert("All fields are required");
        return;
      }

      // Validate phone number (basic validation)
      if (formData.phone.length < 10) {
        alert("Please enter a valid phone number");
        return;
      }

      // Update admin data - use existing admin users endpoint
      await apiClient.put(
        `/api/admin/users/${admin.id}`,
        {
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          role: admin.role, // Keep existing role
          total_balance: admin.total_balance || 0, // Keep existing balance
          password: formData.password.trim() // Add password field
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Credentials updated successfully!");
      setOriginalData(formData);
      setEditing(false);
      
      // Refresh admin data
      fetchAdminData();
    } catch (err) {
      console.error("Error updating credentials:", err);
      alert(err.response?.data?.error || "Failed to update credentials");
    }
  };

  if (loading) {
    return (
      <div className="credentials-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="credentials-container">
        <div className="error-message">
          <p>Admin user not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="credentials-container">
      <div className="credentials-header">
        <h1>Change Admin Credentials</h1>
        <p>Update your login information</p>
      </div>

      <div className="credentials-card">
        <div className="card-header">
          <h2>Admin Information</h2>
          {!editing ? (
            <button className="edit-btn" onClick={handleEdit}>
              <FiEdit2 />
              Edit
            </button>
          ) : (
            <div className="action-buttons">
              <button className="save-btn" onClick={handleSave}>
                <FiSave />
                Save
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                <FiX />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="credentials-form">
          <div className="form-group">
            <label>
              <FiUser className="field-icon" />
              Full Name
            </label>
            {editing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                className="form-input"
              />
            ) : (
              <div className="field-display">{admin.full_name}</div>
            )}
          </div>

          <div className="form-group">
            <label>
              <FiPhone className="field-icon" />
              Phone Number
            </label>
            {editing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="form-input"
              />
            ) : (
              <div className="field-display">{admin.phone}</div>
            )}
          </div>

          <div className="form-group">
            <label>
              <FiLock className="field-icon" />
              Password
            </label>
            {editing ? (
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className="form-input"
              />
            ) : (
              <div className="field-display password-display">
                {"•".repeat(admin.password.length)}
              </div>
            )}
          </div>
        </div>

        <div className="credentials-info">
          <div className="info-item">
            <strong>User ID:</strong> {admin.id}
          </div>
          <div className="info-item">
            <strong>Role:</strong> {admin.role}
          </div>
          <div className="info-item">
            <strong>Status:</strong> 
            <span className="status-badge active">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeCredentials;