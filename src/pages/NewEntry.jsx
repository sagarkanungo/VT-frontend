import React, { useState, useEffect } from "react";
import apiClient from "../../utils/axios";
import { getUserFromToken } from "../../utils/auth";
import { isTransactionAllowed } from "../../utils/timeUtils";
import TransactionGuard from "../components/TransactionGuard";
import Pagination from "../components/Pagination";
import "../assets/css/newEntry.css";

function NewEntry({ onEntrySuccess }) {
  const user = getUserFromToken();
  if (!user) window.location.href = "/login";
  const userId = user.id;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    entryNumber: "",
    amount: ""
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getRowTotal = (row) => Number(row.amount || 0);

  // 🔹 Date formatter
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // 🔹 Fetch history
  useEffect(() => {
    apiClient
      .get(`/api/user/${userId}/entries`)
      .then((res) => {

        if (Array.isArray(res.data)) {
          setRows(
            res.data.map((item) => ({
              
              id: item.id,
              entryNumber: String(item.entry_number ?? ""),
              amount: Number(item.amount ?? 0),
              createdAt: item.created_at
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // 🔹 Save entry
  const handleSave = async () => {
    const entryNum = parseInt(form.entryNumber);
  
    if (
      form.entryNumber === "" ||
      isNaN(entryNum) ||
      entryNum < 0 ||
      entryNum > 9999
    ) {
      alert("Entry Number must be between 0 and 9999");
      return;
    }
  
    const timeCheck = await isTransactionAllowed();
    if (!timeCheck.allowed) {
      alert(timeCheck.message);
      return;
    }
  
    try {
      const payload = {
        entry_number: entryNum,
        amount: Number(form.amount || 0),
        total_amount: Number(form.amount || 0)
      };
  
      const res = await apiClient.post(
        `/api/user/${userId}/entries`,
        payload
      );
      // ✅ latest entry first
      setRows(prev => [
        {
          id: res.data.id,
          entryNumber: String(entryNum),
          amount: payload.amount,
          createdAt: res.data.created_at || new Date().toISOString()
        },
        ...prev
      ]);
  
      // ✅ always show on first page
      setCurrentPage(1);
  
      if (onEntrySuccess) {
        onEntrySuccess(); // dashboard balance refresh
      }
  
      setForm({ entryNumber: "", amount: "" });
      alert("Entry created successfully");
    } catch (err) {
      console.error("API error:", err);
    
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error); // now shows "Insufficient balance" or other backend errors
      } else {
        alert("Save failed"); // fallback for network or unknown errors
      }
    }
    
  };
  

  const grandTotal = rows.reduce(
    (sum, r) => sum + getRowTotal(r),
    0
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = rows.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <div>Loading...</div>;

  return (
    <TransactionGuard>
      <div className="new-entry-form">
        <h3>New Entry</h3>

        {/* 🔹 FORM */}
        <div className="entry-form-box">
          <input
            type="number"
            placeholder="Entry Number (0-9999)"
            value={form.entryNumber}
            min="0"
            max="9999"
            onChange={(e) =>
              setForm({ ...form, entryNumber: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
          />

          <button className="btn-primary" onClick={handleSave}>
            Save Entry
          </button>
        </div>

        {/* 🔹 HISTORY */}
        <div className="entry-table-wrapper">
          <div className="entry-header">
            <span>Entry Number</span>
            <span>Date / Time</span>
            <span>Total Amount</span>
          </div>

          {currentRows.map((row) => (
            <div key={row.id} className="entry-row">
              <div>{row.entryNumber}</div>
              <div>{formatDateTime(row.createdAt)}</div>
              <div className="total-amount-cell">
                {getRowTotal(row)}
              </div>
            </div>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={rows.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        <div className="grand-total">
          Grand Total: {grandTotal}
        </div>
      </div>
    </TransactionGuard>
  );
}

export default NewEntry;
