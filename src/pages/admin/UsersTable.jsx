import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import "../../assets/css/usertable.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    phone: "",
    password: "",
    pin: "",
    balance: 0,
    id_document: null, // file or URL
  });
  const [saving, setSaving] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/users");

      // Filter out admin users, only show normal users
      const normalUsers = res.data.filter((u) => u.role !== "admin");

      // Fetch balances
      const usersWithBalance = await Promise.all(
        normalUsers.map(async (user) => {
          try {
            const balanceRes = await apiClient
              .get(`/api/user/${user.id}/balance`)
              .catch(() => ({ data: { balance: 0 } }));
            const balance = balanceRes.data.balance;
            const numericBalance =
              typeof balance === "string" ? parseFloat(balance) : balance || 0;
            return {
              ...user,
              balance: isNaN(numericBalance) ? 0 : numericBalance,
            };
          } catch {
            return { ...user, balance: 0 };
          }
        })
      );

      setUsers(usersWithBalance);
      setFilteredUsers(usersWithBalance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchTerm) setFilteredUsers(users);
    else {
      const filtered = users.filter(
        (u) =>
          u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const sortedUsers = [...filteredUsers].sort(
    (a, b) => b.id - a.id
  );
  const currentUsers = sortedUsers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure to delete this user?")) return;
    try {
      await apiClient.delete(`/api/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const payUser = async (userId, userFullName) => {
    const amount = prompt(`Enter amount to pay ${userFullName}:`);
    if (!amount) return;

    try {
      // Using direct payment flag as supported by backend
      await apiClient.post("/api/admin/send-money", {
        user_id: userId,
        amount: amount,
        direct_payment: true, // This flag tells backend it's a direct payment
      });

      alert("Payment successful!");
      fetchUsers(); // Refresh the user list to show updated balance
    } catch (err) {
      console.error(err);
      alert("Failed to pay");
    }
  };

  const toggleBlockUser = async (userId, block) => {
    try {
      await apiClient.put(`/api/admin/users/block/${userId}`, { block });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update user");
    }
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name || "",
      phone: user.phone || "",
      password: user.password || "",
      pin: user.pin || "",
      balance: user.balance || 0,
      id_document: user.id_document || null,
    });
  };

  // 🔹 Replace this function
  const handleEditChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "id_document") {
      const file = files[0];
      if (!file) return;

      // Only allow image files
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed (png, jpg, jpeg)");
        return;
      }

      setEditFormData((prev) => ({ ...prev, id_document: file }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("full_name", editFormData.full_name);
      formData.append("phone", editFormData.phone);
      formData.append("password", editFormData.password);
      formData.append("pin", editFormData.pin);
      formData.append("total_balance", editFormData.balance);
      if (editFormData.id_document instanceof File) {
        formData.append("id_document", editFormData.id_document);
      }

      await apiClient.put(`/api/admin/users/${editingUser.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("User updated successfully!");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading users data..." size="large" />;
  }

  return (
    <div className="admin-users-container">
      <h3 className="mt-5">Users List</h3>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="table-responsive">
        <table className="table table-bordered mt-3">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Password</th>
              <th>Pin</th>
              <th>ID Document</th>
              {/* <th>Status</th> */}
              <th width="280">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="8">No users available</td>
              </tr>
            ) : (
              currentUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.phone}</td>
                  {/* <td>{formatCurrency(u.balance)}</td> */}
                  <td>{u.balance}</td>

                  <td>{u.password}</td>
                  <td>{u.pin}</td>
                  <td>
                    {u.id_document ? (
                      <img
                        src={`${BACKEND_URL}/${u.id_document.replace(
                          /\\/g,
                          "/"
                        )}`}
                        alt="ID Document"
                        style={{
                          width: "80px",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                        onClick={() =>
                          window.open(
                            `${BACKEND_URL}/${u.id_document.replace(
                              /\\/g,
                              "/"
                            )}`,
                            "_blank"
                          )
                        }
                        onError={(e) => {
                          e.target.onerror = null; // 🔹 Prevent infinite retry / flickering
                          e.target.src = "/no-image.png"; // Fallback image
                        }}
                      />
                    ) : (
                      "No Document"
                    )}
                  </td>

                  {/* <td>{u.approved ? <span className="badge bg-success">Approved</span> : <span className="badge bg-warning">Pending</span>}</td> */}
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => openEditForm(u)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => payUser(u.id, u.full_name)}
                      >
                        Pay
                      </button>
                      <button
                        className="btn btn-danger btn-sm me-2"
                        onClick={() => deleteUser(u.id)}
                      >
                        Delete
                      </button>
                      <button
                        className={`btn btn-${
                          u.is_blocked ? "success" : "warning"
                        } btn-sm`}
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
        <Pagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="edit-user-modal">
            <div className="modal-header">
              <h3>Edit User</h3>
              <p>Update user information for {editingUser.full_name}</p>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={editFormData.full_name}
                    onChange={handleEditChange}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={editFormData.password}
                    onChange={handleEditChange}
                    placeholder="Enter password"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-text">PIN</span>
                  </label>
                  <input
                    type="text"
                    name="pin"
                    value={editFormData.pin}
                    onChange={handleEditChange}
                    placeholder="Enter PIN"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <span className="label-text">Balance ()</span>
                  </label>
                  <input
                    type="number"
                    name="balance"
                    value={editFormData.balance}
                    onChange={handleEditChange}
                    placeholder="Enter balance amount"
                    min="0"
                    step="0.01"
                  />
                  <small className="balance-note">
                    Current: {editingUser.balance.toLocaleString()} | Admin can
                    directly add/modify user balance
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <span className="label-text">ID Document</span>
                  </label>
                  <input
                    type="file"
                    name="id_document"
                    onChange={handleEditChange}
                    accept="image/png, image/jpeg, image/jpg"
                    className="file-input"
                  />

                  {editFormData.id_document &&
                    !(editFormData.id_document instanceof File) && (
                      <div className="current-document">
                        <img
                          src={`${BACKEND_URL}/${editFormData.id_document}`}
                          alt="Current Document"
                          className="document-preview"
                        />
                        <span className="document-label">Current Document</span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setEditingUser(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={saveUserChanges}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
