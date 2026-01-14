import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import "../../assets/css/analytics.css";

const Analytics = () => {
  const [data, setData] = useState({
    active: [],
    inactive: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = high to low
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryDetails, setEntryDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ================= FETCH ANALYTICS =================
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/entry-analytics");
      const backendEntries = res.data || [];

      const entryMap = {};
      backendEntries.forEach((item) => {
        entryMap[item.entryNumber] = item.totalAmount;
      });

      // All entries from 0 to 9999
      const allEntries = Array.from({ length: 10000 }, (_, i) => ({
        entryNumber: i,
        totalAmount: entryMap[i] || 0,
      }));

      const inactive = allEntries.filter((e) => e.totalAmount === 0);
      const active = allEntries.filter((e) => e.totalAmount > 0);

      setData({ active, inactive });
    } catch (err) {
      console.error("Analytics error:", err);
      setData({ active: [], inactive: [] });
    } finally {
      setLoading(false);
    }
  };

  // ================= SORT ACTIVE =================
  const sortedActive = [...data.active].sort((a, b) =>
    sortOrder === "desc"
      ? b.totalAmount - a.totalAmount
      : a.totalAmount - b.totalAmount
  );

  const activeGrandTotal = sortedActive.reduce(
    (sum, entry) => sum + entry.totalAmount,
    0
  );

  // ================= FETCH ENTRY DETAILS =================
  const openEntryDetails = async (entryNumber) => {
    setSelectedEntry(entryNumber);
    setEntryDetails(null);
    setDetailsLoading(true);

    try {
      const res = await apiClient.get(
        `/api/admin/entry-analytics/${entryNumber}`
      );
      setEntryDetails(res.data);
    } catch (err) {
      console.error("Entry detail error:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // ================= DOWNLOAD CSV =================
  const downloadUserList = () => {
    if (
      !entryDetails ||
      !entryDetails.users ||
      entryDetails.users.length === 0
    ) {
      alert("No user data to download");
      return;
    }

    const csvHeaders = ["Entry Number", "Name", "Mobile", "Amount"];
    const csvData = entryDetails.users.map((user) => [
      String(entryDetails.entryNumber).padStart(4, "0"),
      user.name,
      user.mobile,
      user.amount,
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute(
      "download",
      `entry-${String(entryDetails.entryNumber).padStart(4, "0")}-users.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const resetAllActive = async () => {
    if (!window.confirm("Are you sure you want to reset all active entries?"))
      return;

    try {
      await apiClient.post("/api/admin/entry-analytics/reset-all-active");
      alert("All active entries have been reset");
      fetchAnalytics(); // refresh the table
    } catch (err) {
      console.error("Reset all active error:", err);
      alert("Failed to reset all active entries");
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <LoadingSpinner message="Loading analytics..." size="large" />
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* ================= HEADER ================= */}
      <div className="analytics-header">
        <h1>Entry Number Analytics</h1>
        <button className="refresh-btn" onClick={fetchAnalytics}>
          🔄 Refresh
        </button>
      </div>

      {/* ================= TABS ================= */}
      <div className="analytics-section">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            ⚡ Active
            <span className="tab-count">{data.active.length}</span>
          </button>

          <button
            className={`tab-button ${activeTab === "inactive" ? "active" : ""}`}
            onClick={() => setActiveTab("inactive")}
          >
            💤 Inactive
            <span className="tab-count">{data.inactive.length}</span>
          </button>
        </div>

        <div className="tab-content">
          {/* ================= ACTIVE ================= */}
          {activeTab === "active" && (
            <>
              <div style={{ marginBottom: "1rem", textAlign: "right" }}>
                <button onClick={resetAllActive} className="reset-all-btn">
                  Reset All Active
                </button>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                  }
                  className="refresh-btn"
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                >
                  Sort: {sortOrder === "desc" ? "High → Low" : "Low → High"}
                </button>
              </div>

              <div className="active-entries-rows scrollable">
                <div className="row header">
                  <div className="cell">Entry Number</div>
                  <div className="cell">Total Amount</div>
                  <div className="cell">Action</div>
                </div>
                {sortedActive.map((entry) => (
                  <div key={entry.entryNumber} className="row">
                    <div className="cell">
                      {String(entry.entryNumber).padStart(4, "0")}
                    </div>
                    <div className="cell">
                      {entry.totalAmount.toLocaleString()}
                    </div>
                    <div className="cell">
                      <button
                        className="view-btn"
                        onClick={() => openEntryDetails(entry.entryNumber)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grand-total">
                Grand Total: {activeGrandTotal.toLocaleString()}
              </div>
            </>
          )}

          {/* ================= INACTIVE ================= */}
          {activeTab === "inactive" && (
            <div className="inactive-entries-rows scrollable">
              <div className="row header">
                <div className="cell">Entry Number</div>
                <div className="cell">Total Amount</div>
                <div className="cell">Action</div>
              </div>
              {data.inactive.map((entry) => (
                <div key={entry.entryNumber} className="row">
                  <div className="cell">
                    {String(entry.entryNumber).padStart(4, "0")}
                  </div>
                  <div className="cell">
                    {entry.totalAmount.toLocaleString()}
                  </div>
                  <div className="cell">
                    <button
                      className="view-btn"
                      onClick={() => openEntryDetails(entry.entryNumber)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= ENTRY DETAILS MODAL ================= */}
      {selectedEntry !== null && (
        <div className="entry-modal-overlay">
          <div className="entry-modal">
            <button
              className="close-btn"
              onClick={() => setSelectedEntry(null)}
            >
              ✖
            </button>

            {detailsLoading ? (
              <LoadingSpinner message="Loading entry details..." />
            ) : entryDetails ? (
              <>
                <div className="modal-header-content">
                  <h2>
                    Entry Number:{" "}
                    {String(entryDetails.entryNumber).padStart(4, "0")}
                  </h2>
                  <button
                    className="download-btn"
                    onClick={downloadUserList}
                    title="Download user list as CSV"
                  >
                    📥 Download
                  </button>
                </div>

                <div className="entry-summary">
                  <p>
                    <strong>Total Users:</strong> {entryDetails.totalUsers}
                  </p>
                  <p>
                    <strong>Total Amount:</strong>{" "}
                    {entryDetails.totalAmount.toLocaleString()}
                  </p>
                </div>

                <table className="entry-details-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entryDetails.users.map((u, index) => (
                      <tr key={u.userId}>
                        <td data-label="#">{index + 1}</td>
                        <td data-label="Name">{u.name}</td>
                        <td data-label="Mobile">{u.mobile}</td>
                        <td data-label="Amount">{u.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p style={{ padding: "1rem" }}>No details found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
