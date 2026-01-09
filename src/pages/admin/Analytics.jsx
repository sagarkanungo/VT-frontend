import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import "../../assets/css/analytics.css";

const Analytics = () => {
  const [data, setData] = useState({
    highActive: [],
    midActive: [],
    inactive: [],
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("highActive");

  // 🔥 Entry details states
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

      const allEntries = Array.from({ length: 10000 }, (_, i) => ({
        entryNumber: i,
        totalAmount: entryMap[i] || 0,
      }));

      const inactive = allEntries.filter((e) => e.totalAmount === 0);
      const active = allEntries.filter((e) => e.totalAmount > 0);

      const sortedActive = [...active].sort(
        (a, b) => b.totalAmount - a.totalAmount
      );

      const highActive = sortedActive.slice(0, 5);
      const midActive = sortedActive.slice(5, 10);

      setData({ highActive, midActive, inactive });
    } catch (err) {
      console.error("Analytics error:", err);
      setData({ highActive: [], midActive: [], inactive: [] });
    } finally {
      setLoading(false);
    }
  };

  // ================= DOWNLOAD FUNCTIONALITY =================
  const downloadUserList = () => {
    if (!entryDetails || !entryDetails.users || entryDetails.users.length === 0) {
      alert("No user data to download");
      return;
    }

    // Prepare CSV data with Entry Number
    const csvHeaders = ["Entry Number", "Name", "Mobile", "Amount"];
    const csvData = entryDetails.users.map((user) => [
      String(entryDetails.entryNumber).padStart(4, "0"), // Entry Number with leading zeros
      user.name,
      user.mobile,
      user.amount
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `entry-${String(entryDetails.entryNumber).padStart(4, "0")}-users.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
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

  if (loading) {
    return (
      <div className="analytics-container">
        <LoadingSpinner message="Loading analytics..." size="large" />
      </div>
    );
  }

  console.log("entryDetails", entryDetails);

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
            className={`tab-button ${
              activeTab === "highActive" ? "active" : ""
            }`}
            onClick={() => setActiveTab("highActive")}
          >
            🔥 Most Active
            <span className="tab-count">{data.highActive.length}</span>
          </button>

          <button
            className={`tab-button ${
              activeTab === "midActive" ? "active" : ""
            }`}
            onClick={() => setActiveTab("midActive")}
          >
            ⚡ Low Active
            <span className="tab-count">{data.midActive.length}</span>
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
          {/* ================= HIGH + MID ACTIVE ================= */}
          {activeTab !== "inactive" && (
            <div className="entry-category-section">
              <div className="category-header">
                <h3>
                  {activeTab === "highActive"
                    ? "🏆 Most Active Entry Numbers"
                    : "⚡ Mid Active Entry Numbers"}
                </h3>
              </div>

              <div className="entries-grid">
                {data[activeTab].map((entry, index) => (
                  <div
                    key={entry.entryNumber}
                    className={`entry-card ${
                      activeTab === "highActive" ? "most-active" : "mid-active"
                    }`}
                    onClick={() => openEntryDetails(entry.entryNumber)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="entry-rank">#{index + 1}</div>

                    <div className="entry-details">
                      <h4>{String(entry.entryNumber).padStart(4, "0")}</h4>
                      <p>Entry Number</p>
                    </div>

                    <div className="entry-stats">
                      <span>{entry.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= INACTIVE ================= */}
          {activeTab === "inactive" && (
            <div className="inactive-grid scrollable">
              {data.inactive.map((entry) => (
                <div key={entry.entryNumber} className="inactive-entry-card">
                  {String(entry.entryNumber).padStart(4, "0")}
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
                    <strong>Total Amount:</strong> 
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
              <p>No details found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
