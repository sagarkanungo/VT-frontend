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

  // 🔹 Calculate per-row total (derived value)
  const getRowTotal = (row) =>
    Number(row.amount || 0) + Number(row.amount2 || 0);

  // 🔹 Fetch entries
  useEffect(() => {
    apiClient
      .get(`/api/user/${userId}/entries`)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
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
      .catch(() => {
        setRows([
          { entryNumber: "", amount: "", amount2: "", isNew: true }
        ]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // 🔹 Add new row
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

  // 🔹 Save row (create / update)
  const handleSave = async (index) => {
    const row = rows[index];

    const entryNum = parseInt(row.entryNumber);
    if (
      row.entryNumber === "" ||
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
      const dataToSave = {
        entry_number: entryNum,
        amount: Number(row.amount || 0),
        amount2: Number(row.amount2 || 0),
        total_amount: getRowTotal(row) // ✅ NEW KEY
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
    } catch (err) {
      alert("Save failed");
    }
  };

  // 🔹 Delete row
  const handleDelete = async (index) => {
    const row = rows[index];

    if (rows.length === 1 && row.isNew) return;

    const timeCheck = await isTransactionAllowed();
    if (!timeCheck.allowed) {
      alert(timeCheck.message);
      return;
    }

    if (row.isNew) {
      setRows(rows.filter((_, i) => i !== index));
    } else {
      await apiClient.delete(`/api/entries/${row.id}`);
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  // 🔹 Grand total (all entries)
  const grandTotal = rows.reduce(
    (sum, r) => sum + getRowTotal(r),
    0
  );

  // 🔹 Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = rows.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <div>Loading...</div>;

  return (
    <TransactionGuard>
      <div className="new-entry-form">
        <h3>New Entry</h3>

        <div className="entry-table-wrapper">
          {/* Header */}
          <div className="entry-header">
            <span>Entry Number</span>
            <span>Amount</span>
            <span>Amount 2</span>
            <span>Total Amount</span>
            <span>Action</span>
          </div>

          {/* Rows */}
          {currentRows.map((row, i) => {
            const actualIndex = indexOfFirstItem + i;

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
                    if (
                      value === "" ||
                      (parseInt(value) >= 0 && parseInt(value) <= 9999)
                    ) {
                      handleChange(actualIndex, "entryNumber", value);
                    }
                  }}
                />

                <input
                  type="number"
                  placeholder="Amount"
                  value={row.amount}
                  onChange={(e) =>
                    handleChange(actualIndex, "amount", e.target.value)
                  }
                />

                <input
                  type="number"
                  placeholder="Amount 2"
                  value={row.amount2}
                  onChange={(e) =>
                    handleChange(actualIndex, "amount2", e.target.value)
                  }
                />

                {/* ✅ Per Entry Total */}
                <div className="total-amount-cell">
                  {getRowTotal(row)}
                </div>

                <div className="row-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleSave(actualIndex)}
                  >
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

        <Pagination
          currentPage={currentPage}
          totalItems={rows.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        <button className="btn-secondary add-row-btn" onClick={addRow}>
          + Add Row
        </button>

        {/* ✅ Grand Total */}
        <div className="grand-total">
          Grand Total: {grandTotal}
        </div>
      </div>
    </TransactionGuard>
  );
}

export default NewEntry;
