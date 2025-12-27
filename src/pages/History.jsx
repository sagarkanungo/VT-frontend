import React, { useState, useEffect } from "react";
import apiClient from "../../utils/axios";
import { getUserFromToken } from "../../utils/auth";
import Pagination from "../components/Pagination";

function History() {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const user = getUserFromToken();

  useEffect(() => {
    apiClient
      .get(`/api/user/${user.id}/transactions`)
      .then((res) => setTransactions(res.data))
      .catch(() => setTransactions([]));
  }, [user.id]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="history-list">
      <h3>Transaction History</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="4">No transactions yet</td>
            </tr>
          ) : (
            currentTransactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.message || t.description}</td>
                <td>₹{t.amount}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {transactions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={transactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default History;
