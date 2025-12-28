import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import '../../assets/css/usertable.css'

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const token = localStorage.getItem("token");

  // Helper function to calculate activity level
  const getActivityLevel = (uniqueEntryNumbers) => {
    if (uniqueEntryNumbers >= 20) return 'high';
    if (uniqueEntryNumbers >= 10) return 'medium';
    return 'low';
  };

  // Fetch all users with their activity data
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/users");
      console.log('fetch', res.data)

      // Separate admin from other users
      const adminUser = res.data.find((u) => u.role === "admin");
      const normalUsers = res.data.filter((u) => u.role !== "admin");

      // Fetch additional data for each user (balance and entries)
      const usersWithActivityData = await Promise.all(
        normalUsers.map(async (user) => {
          try {
            const [balanceRes, entriesRes] = await Promise.all([
              apiClient.get(`/api/user/${user.id}/balance`).catch(() => ({ data: { balance: 0 } })),
              apiClient.get(`/api/user/${user.id}/entries`).catch(() => ({ data: [] }))
            ]);

            // Calculate unique entry numbers
            const entries = entriesRes.data || [];
            const uniqueEntryNumbers = new Set(entries.map(entry => entry.entry_number)).size;
            const activityLevel = getActivityLevel(uniqueEntryNumbers);

            // Ensure balance is a number
            const balance = balanceRes.data.balance;
            const numericBalance = typeof balance === 'string' ? parseFloat(balance) : (balance || 0);

            return {
              ...user,
              balance: isNaN(numericBalance) ? 0 : numericBalance,
              uniqueEntryNumbers: uniqueEntryNumbers,
              activityLevel: activityLevel,
              totalEntries: entries.length
            };
          } catch (error) {
            console.error(`Error fetching data for user ${user.id}:`, error);
            return {
              ...user,
              balance: 0,
              uniqueEntryNumbers: 0,
              activityLevel: 'low',
              totalEntries: 0
            };
          }
        })
      );

      setAdmin(adminUser);
      setUsers(usersWithActivityData);
      setFilteredUsers(usersWithActivityData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.full_name.toLowerCase().includes(searchLower) ||
          user.phone.toLowerCase().includes(searchLower) ||
          (user.activityLevel === 'high' && 'high active'.includes(searchLower)) ||
          (user.activityLevel === 'medium' && 'mid active'.includes(searchLower)) ||
          (user.activityLevel === 'low' && 'low active'.includes(searchLower)) ||
          user.activityLevel.toLowerCase().includes(searchLower)
        );
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  console.log('currentUsers', currentUsers)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (id) => {
    try {
      await apiClient.put(
        `/api/users/${id}/approve`,
        {}
      );
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to approve user");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure to delete this user?")) return;
    try {
      await apiClient.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const toggleBlockUser = async (userId, block) => {
    try {
      await apiClient.put(`/api/admin/users/block/${userId}`, { block });
      // alert(`User has been ${block ? "blocked" : "unblocked"}`);
      fetchUsers(); // refresh table
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update user");
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="admin-users-container">
        <h3 className="mt-5">Users List</h3>
        <LoadingSpinner message="Loading users data..." size="large" />
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <h3 className="mt-5">Users List</h3>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, phone, or activity level..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <div className="search-icon">🔍</div>
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="search-results">
          {searchTerm && (
            <span className="results-count">
              {filteredUsers.length} of {users.length} users found
            </span>
          )}
          {filteredUsers.length > itemsPerPage && (
            <span className="pagination-info">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
            </span>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="activity-summary">
        <div className="summary-card high">
          <span className="summary-count">{filteredUsers.filter(u => u.activityLevel === 'high').length}</span>
          <span className="summary-label">High Active</span>
        </div>
        <div className="summary-card medium">
          <span className="summary-count">{filteredUsers.filter(u => u.activityLevel === 'medium').length}</span>
          <span className="summary-label">Mid Active</span>
        </div>
        <div className="summary-card low">
          <span className="summary-count">{filteredUsers.filter(u => u.activityLevel === 'low').length}</span>
          <span className="summary-label">Low Active</span>
        </div>
        <div className="summary-card total">
          <span className="summary-count">{filteredUsers.length}</span>
          <span className="summary-label">Total Users</span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered mt-3">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Activity Level</th>
              <th>Entry Numbers</th>
              <th>Password</th>
              <th>Pin</th>
              <th>ID</th>
              <th>Status</th>
              <th width="220">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-results">
                  {searchTerm ?
                    `No users found matching "${searchTerm}"` :
                    'No users available'
                  }
                </td>
              </tr>
            ) : (
              currentUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.phone}</td>
                  <td className="balance-cell">{formatCurrency(u.balance)}</td>
                  <td>
                    <span className={`activity-badge ${u.activityLevel}`}>
                      {u.activityLevel === 'high' ? 'High Active' :
                        u.activityLevel === 'medium' ? 'Mid Active' : 'Low Active'}
                    </span>
                  </td>
                  <td className="entry-numbers-cell">
                    <span className="entry-count">{u.uniqueEntryNumbers}</span>
                    <small className="entry-total">({u.totalEntries} total)</small>
                  </td>
                  <td>{u.password}</td>
                  <td>{u.pin}</td>
                  <td>
                    {u.id_document ? (() => {
                      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
                      const imagePath = u.id_document.replace(/\\/g, "/");
                      const imageUrl = `${BACKEND_URL}/${imagePath}`;

                      return (
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={imageUrl}
                            alt="ID Document"
                            style={{
                              width: "80px",
                              height: "auto",
                              cursor: "pointer",
                              borderRadius: "4px"
                            }}
                            onError={(e) => {
                              e.target.src = "/no-image.png"; // optional fallback
                            }}
                          />
                        </a>
                      );
                    })() : (
                      <span className="text-muted">No Document</span>
                    )}
                  </td>


                  <td>
                    {u.approved ? (
                      <span className="badge bg-success">Approved</span>
                    ) : (
                      <span className="badge bg-warning">Pending</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-danger btn-sm me-2"
                        onClick={() => deleteUser(u.id)}
                      >
                        Delete
                      </button>
                      <button
                        className={`btn btn-${u.is_blocked ? "success" : "warning"} btn-sm`}
                        onClick={() => toggleBlockUser(u.id, !u.is_blocked)}
                      >
                        {u.is_blocked ? "Unblock" : "Block"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;

