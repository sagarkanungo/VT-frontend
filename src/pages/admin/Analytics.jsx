import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import "../../assets/css/analytics.css";

const Analytics = () => {
  const [data, setData] = useState({
    highActive: [],
    midActive: [], // low active but shown as "Mid Active" in UI
    inactive: []
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("highActive");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/entry-analytics");
      const backendEntries = res.data || [];

      /**
       * STEP 1: Map backend data
       * entryNumber => totalAmount
       */
      const entryMap = {};
      backendEntries.forEach(item => {
        entryMap[item.entryNumber] = item.totalAmount;
      });

      /**
       * STEP 2: Generate all entries (0000–9999)
       */
      const allEntries = Array.from({ length: 10000 }, (_, i) => ({
        entryNumber: i,
        totalAmount: entryMap[i] || 0
      }));

      /**
       * STEP 3: Separate inactive (amount === 0) and active (amount > 0)
       */
      const inactive = allEntries.filter(e => e.totalAmount === 0);
      const active = allEntries.filter(e => e.totalAmount > 0);

      /**
       * STEP 4: Sort all active entries by spending (highest to lowest)
       */
      const sortedActive = [...active].sort((a, b) => b.totalAmount - a.totalAmount);

      /**
       * STEP 5: High Active = Top 5 highest spenders (or less if not enough)
       * No overlap with Mid Active
       */
      const highActive = sortedActive.slice(0, 5);

      /**
       * STEP 6: Mid Active = Next 5 entries after High Active (or less if not enough)
       * These are the remaining active entries with lower spending
       */
      const remainingActive = sortedActive.slice(5); // Skip top 5
      const midActive = remainingActive.slice(0, 5); // Take next 5

      setData({ highActive, midActive, inactive });
    } catch (err) {
      console.error("Analytics error:", err);
      setData({ highActive: [], midActive: [], inactive: [] });
    } finally {
      setLoading(false);
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
            className={`tab-button ${activeTab === "highActive" ? "active" : ""}`}
            onClick={() => setActiveTab("highActive")}
          >
            🔥 Most Active
            <span className="tab-count">{data.highActive.length}</span>
          </button>

          <button
            className={`tab-button ${activeTab === "midActive" ? "active" : ""}`}
            onClick={() => setActiveTab("midActive")}
          >
            ⚡ Mid Active
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
                <p>
                  {activeTab === "highActive"
                    ? "Top 5 entry numbers with highest transaction amounts"
                    : "Next 5 entry numbers with moderate transaction amounts"}
                </p>
              </div>

              {data[activeTab].length === 0 ? (
                <div className="no-data">
                  <p>No data available</p>
                </div>
              ) : (
                <div className="entries-grid">
                  {data[activeTab].map((entry, index) => (
                    <div
                      key={entry.entryNumber}
                      className={`entry-card ${
                        activeTab === "highActive"
                          ? "most-active"
                          : "mid-active"
                      }`}
                    >
                      <div className="entry-rank">#{index + 1}</div>

                      <div className="entry-details">
                        <h4>
                          {String(entry.entryNumber).padStart(4, "0")}
                        </h4>
                        <p>Entry Number</p>
                      </div>

                      <div className="entry-stats">
                        <div className="stat">
                          <span className="stat-label">Total Amount</span>
                          <span className="stat-value">
                            ₹{entry.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Level</span>
                          <span className="stat-value">
                            {activeTab === "highActive" ? "High" : "Mid"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= INACTIVE ================= */}
          {activeTab === "inactive" && (
            <div className="entry-category-section">
              <div className="category-header">
                <h3>💤 Inactive Entry Numbers</h3>
                <p>All entry numbers with zero transactions</p>
              </div>

              <div className="inactive-entries-container">
                <div className="inactive-stats">
                  <div className="stat-card">
                    <span className="stat-number">
                      {data.inactive.length}
                    </span>
                    <span className="stat-text">Inactive</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">
                      {10000 - data.inactive.length}
                    </span>
                    <span className="stat-text">Active</span>
                  </div>
                </div>

                {/* SCROLLABLE INACTIVE LIST */}
                <div className="inactive-grid scrollable">
                  {data.inactive.map(entry => (
                    <div
                      key={entry.entryNumber}
                      className="inactive-entry-card"
                    >
                      {String(entry.entryNumber).padStart(4, "0")}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
