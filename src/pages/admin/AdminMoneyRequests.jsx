import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import Pagination from "../../components/Pagination";

const AdminMoneyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const token = localStorage.getItem("token");

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get(
        "/api/admin/money-requests"
      );
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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
  const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <h3>Pending Money Requests</h3>
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
            {currentRequests.map((r) => (
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
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {requests.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={requests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default AdminMoneyRequests;
