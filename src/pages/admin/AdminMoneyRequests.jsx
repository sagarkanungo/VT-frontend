import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";

const AdminMoneyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/money-requests");
      setRequests(res.data);
      setFilteredRequests(res.data);
    } catch (err) {
      console.error(err);
      setRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(request => {
        const searchLower = searchTerm.toLowerCase();
        return (
          request.full_name.toLowerCase().includes(searchLower) ||
          request.phone.toLowerCase().includes(searchLower) ||
          request.message.toLowerCase().includes(searchLower) ||
          request.status.toLowerCase().includes(searchLower) ||
          request.id.toString().includes(searchTerm)
        );
      });
      setFilteredRequests(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, requests]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const payRequest = async (requestId, userFullName) => {
    const amount = prompt(`Enter amount to pay ${userFullName}:`);
    if (!amount) return;

    try {
      await apiClient.post(
        "/api/admin/send-money",
        { request_id: requestId, amount }
      );
      alert("Payment successful!");
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to pay");
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return <LoadingSpinner message="Loading money requests..." size="large" />;
  }

  return (
    <div>
      <h3>Pending Money Requests</h3>
      
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, phone, message, status, or ID..."
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
              {filteredRequests.length} of {requests.length} requests found
            </span>
          )}
          {filteredRequests.length > itemsPerPage && (
            <span className="pagination-info">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} requests
            </span>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered mt-3">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Phone</th>
              <th>Message</th>
              <th>Status</th>
              <th width="150">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentRequests.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-results">
                  {searchTerm ? 
                    `No requests found matching "${searchTerm}"` : 
                    'No money requests yet'
                  }
                </td>
              </tr>
            ) : (
              currentRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.full_name}</td>
                  <td>{r.phone}</td>
                  <td>{r.message}</td>
                  <td>
                    {r.status === "approved" ? (
                      <span className="badge bg-success">Approved</span>
                    ) : (
                      <span className="badge bg-warning">Pending</span>
                    )}
                  </td>
                  <td>
                    {r.status === "pending" && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => payRequest(r.id, r.full_name)}
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default AdminMoneyRequests;
