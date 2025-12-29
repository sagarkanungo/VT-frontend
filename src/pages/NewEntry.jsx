import React, { useState, useEffect } from "react";
import apiClient from "../../utils/axios";
import { getUserFromToken } from "../../utils/auth";
import { isTransactionAllowed } from "../../utils/timeUtils";
import TransactionGuard from "../components/TransactionGuard";
import Pagination from "../components/Pagination";
import "../assets/css/dashboard.css";

function NewEntry() {
  const user = getUserFromToken();
  if (!user) window.location.href = "/login";

  const userId = user.id;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Fetch entries
  useEffect(() => {
    apiClient
      .get(`/api/user/${userId}/entries`)
      .then((res) => {
        if (res.data.length === 0) {
          setRows([
            { entryNumber: "", amount: "", amount2: "", isNew: true }
          ]);
        } else {
          const formatted = res.data.map((item) => ({
            id: item.id,
            entryNumber: String(item.entry_number ?? ""),
            amount: Number(item.amount ?? 0),
            amount2: Number(item.amount2 ?? 0),
            isNew: false
          }));
          setRows(formatted);
        }
      })
      .catch(() =>
        setRows([
          { entryNumber: "", amount: "", amount2: "", isNew: true }
        ])
      )
      .finally(() => setLoading(false));
  }, [userId]);

  // Add new row
  const addRow = () => {
    setRows([
      ...rows,
      { entryNumber: "", amount: "", amount2: "", isNew: true }
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleSave = async (index) => {
    const row = rows[index];
    
    // Validate entry number (0-9999)
    const entryNum = parseInt(row.entryNumber);
    if (row.entryNumber === "" || isNaN(entryNum) || entryNum < 0 || entryNum > 9999) {
      alert("Entry Number must be between 0 and 9999");
      return;
    }
    
    // Check if transactions are allowed before saving
    const timeCheck = await isTransactionAllowed();
    if (!timeCheck.allowed) {
      alert(timeCheck.message);
      return;
    }

    try {
      const dataToSave = {
        entry_number: entryNum,
        amount: row.amount,
        amount2: row.amount2
      };

      if (row.isNew) {
        const res = await apiClient.post(
          `/api/user/${userId}/entries`,
          dataToSave
        );
        row.id = res.data.id;
        row.isNew = false;
      } else {
        await apiClient.put(
          `/api/entries/${row.id}`,
          dataToSave
        );
      }
      setRows([...rows]);
    } catch {
      alert("Save failed");
    }
  };

  const handleDelete = async (index) => {
    const row = rows[index];

    if (rows.length === 1 && row.isNew) return;

    // Check if transactions are allowed before deleting
    const timeCheck = await isTransactionAllowed();
    if (!timeCheck.allowed) {
      alert(timeCheck.message);
      return;
    }

    if (row.isNew) {
      setRows(rows.filter((_, i) => i !== index));
    } else {
      await apiClient.delete(
        `/api/entries/${row.id}`
      );
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  // Grand total (amount + amount2)
  const totalAmount = rows.reduce(
    (sum, r) =>
      sum +
      Number(r.amount || 0) +
      Number(r.amount2 || 0),
    0
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = rows.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) return <div>Loading...</div>;
//sagar
  return (
    <TransactionGuard>
      <div className="new-entry-form">
        <h3>New Entry</h3>

        {/* Table Header */}
        <div className="entry-table-wrapper">

        <div className="entry-header">
          <span>Entry Number</span>
          <span>Amount</span>
          <span>Amount 2</span>
          <span>Action</span>
        </div>

        {/* Rows */}
        {currentRows.map((row, i) => {
          const actualIndex = indexOfFirstItem + i; // Calculate actual index for operations
          return (
            <div key={row.id ?? actualIndex} className="entry-row">
              <input
                type="number"
                placeholder="Entry Number (0-9999)"
                value={row.entryNumber}
                min="0"
                max="9999"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 9999)) {
                    handleChange(actualIndex, "entryNumber", value);
                  }
                }}
              />

            

              <input
                type="number"
                placeholder="Amount"
                value={row.amount}
                onChange={(e) =>
                  handleChange(actualIndex, "amount", (e.target.value))
                }
              />

              <input
                type="number"
                placeholder="Amount 2"
                value={row.amount2}
                onChange={(e) =>
                  handleChange(actualIndex, "amount2", (e.target.value))
                }
              />

              <div className="row-actions">
                <button className="btn-primary" onClick={() => handleSave(actualIndex)}>
                  Save
                </button>
                <button
                  className="btn-danger"
                  disabled={rows.length === 1 && row.isNew}
                  onClick={() => handleDelete(actualIndex)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
              </div>


        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={rows.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />

        <button className="btn-secondary add-row-btn" onClick={addRow}>
          + Add Row
        </button>

        <div className="grand-total">
          Grand Total: ₹{totalAmount}
        </div>
      </div>
    </TransactionGuard>
  );
}

export default NewEntry;
