import React, { useState, useEffect } from "react";
import apiClient from "../../utils/axios";
import { getUserFromToken } from "../../utils/auth";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";

function History() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getUserFromToken();

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/api/user/${user.id}/transactions`)
      .then((res) => {
        setTransactions(res.data);
        setFilteredTransactions(res.data);
      })
      .catch(() => {
        setTransactions([]);
        setFilteredTransactions([]);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  // Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(transaction => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (transaction.message || transaction.description || '').toLowerCase().includes(searchLower) ||
          transaction.amount.toString().includes(searchTerm) ||
          transaction.id.toString().includes(searchTerm) ||
          new Date(transaction.created_at).toLocaleDateString().includes(searchTerm)
        );
      });
      setFilteredTransactions(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, transactions]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return <LoadingSpinner message="Loading transaction history..." size="large" />;
  }

  return (
    <div className="history-list">
      <h3>Transaction History</h3>
      
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by description, amount, ID, or date..."
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
              {filteredTransactions.length} of {transactions.length} transactions found
            </span>
          )}
          {filteredTransactions.length > itemsPerPage && (
            <span className="pagination-info">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </span>
          )}
        </div>
      </div>

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
          {currentTransactions.length === 0 ? (
            <tr>
              <td colSpan="4" className="no-results">
                {searchTerm ? 
                  `No transactions found matching "${searchTerm}"` : 
                  'No transactions yet'
                }
              </td>
            </tr>
          ) : (
            currentTransactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.message || t.description}</td>
                <td>{t.amount}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default History;
