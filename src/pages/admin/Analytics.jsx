import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import "../../assets/css/analytics.css";

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    entryNumberCategories: {
      mostActive: [],
      midActive: [],
      leastActive: [],
      total: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mostActive");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all users to get their entries
      const usersRes = await apiClient.get("/api/admin/users");
      
      // Process the data
      const processedData = await processAnalyticsData(usersRes.data);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Set empty data if API fails
      setAnalyticsData({
        entryNumberCategories: {
          mostActive: [],
          midActive: [],
          leastActive: [],
          total: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = async (users) => {
    // Filter out admin users
    const normalUsers = users.filter(user => user.role !== "admin");
    
    // Get all entries from all users
    const allEntries = [];
    
    for (const user of normalUsers) {
      try {
        const entriesRes = await apiClient.get(`/api/user/${user.id}/entries`);
        if (entriesRes.data && entriesRes.data.length > 0) {
          allEntries.push(...entriesRes.data);
        }
      } catch (error) {
        console.error(`Error fetching entries for user ${user.id}:`, error);
        // Continue with other users even if one fails
      }
    }

    // Analyze entry number activity
    const entryNumberCategories = analyzeEntryNumberActivity(allEntries);

    return {
      entryNumberCategories
    };
  };

  const analyzeEntryNumberActivity = (allEntries) => {
    // Count usage frequency for each entry number
    const entryNumberStats = {};
    
    allEntries.forEach(entry => {
      const entryNumber = entry.entry_number;
      if (!entryNumberStats[entryNumber]) {
        entryNumberStats[entryNumber] = {
          entryNumber: entryNumber,
          usageCount: 0,
          lastUsed: entry.created_at
        };
      }
      
      entryNumberStats[entryNumber].usageCount += 1;
      
      // Update last used date if this entry is more recent
      if (new Date(entry.created_at) > new Date(entryNumberStats[entryNumber].lastUsed)) {
        entryNumberStats[entryNumber].lastUsed = entry.created_at;
      }
    });

    // Convert to array
    const entryNumberArray = Object.values(entryNumberStats);
    
    // Categorize based on usage thresholds
    const mostActive = entryNumberArray
      .filter(entry => entry.usageCount >= 50)  // 50+ times = Most Active
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);  // Top 5 from most active
    
    const midActive = entryNumberArray
      .filter(entry => entry.usageCount >= 20 && entry.usageCount < 50)  // 20-49 times = Mid Active
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);  // Top 5 from mid active
    
    const leastActive = entryNumberArray
      .filter(entry => entry.usageCount < 20)  // Less than 20 times = Low Active
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);  // Top 5 from least active
    
    return {
      mostActive,
      midActive,
      leastActive,
      total: entryNumberArray.length
    };
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>Entry Number Analytics</h1>
        </div>
        <LoadingSpinner message="Loading entry number data..." size="large" />
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Entry Number Analytics</h1>
        <button 
          className="refresh-btn"
          onClick={fetchAnalyticsData}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      <div className="analytics-content">
        {/* Entry Number Activity Categories with Tabs */}
        <div className="analytics-section">
          <h2>Entry Number Activity Analysis </h2>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'mostActive' ? 'active' : ''}`}
              onClick={() => setActiveTab('mostActive')}
            >
              Most Active
              <span className="tab-count">{analyticsData.entryNumberCategories?.mostActive?.length || 0}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'midActive' ? 'active' : ''}`}
              onClick={() => setActiveTab('midActive')}
            >
              Mid Active
              <span className="tab-count">{analyticsData.entryNumberCategories?.midActive?.length || 0}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'leastActive' ? 'active' : ''}`}
              onClick={() => setActiveTab('leastActive')}
            >
              Low Active
              <span className="tab-count">{analyticsData.entryNumberCategories?.leastActive?.length || 0}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'mostActive' && (
              <div className="entry-category-section">
                <div className="category-header">
                  <h3>Most Active Entry Numbers</h3>
                  <p>Entry numbers used 50+ times (Top 5)</p>
                </div>
                <div className="entries-grid">
                  {analyticsData.entryNumberCategories?.mostActive?.length > 0 ? (
                    analyticsData.entryNumberCategories.mostActive.map((entry, index) => (
                      <div key={entry.entryNumber} className="entry-card most-active">
                        <div className="entry-rank">#{index + 1}</div>
                        <div className="entry-details">
                          <h4>Entry #{entry.entryNumber}</h4>
                          <p>Used {entry.usageCount} times</p>
                        </div>
                        <div className="entry-stats">
                          <div className="stat">
                            <span className="stat-label">Usage Count</span>
                            <span className="stat-value">{entry.usageCount}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Last Used</span>
                            <span className="stat-value">{getTimeAgo(entry.lastUsed)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">
                      <p>No entry number data available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'midActive' && (
              <div className="entry-category-section">
                <div className="category-header">
                  <h3>Mid-Level Entry Numbers</h3>
                  <p>Entry numbers used 20-49 times (Top 5)</p>
                </div>
                <div className="entries-grid">
                  {analyticsData.entryNumberCategories?.midActive?.length > 0 ? (
                    analyticsData.entryNumberCategories.midActive.map((entry, index) => (
                      <div key={entry.entryNumber} className="entry-card mid-active">
                        <div className="entry-rank">#{index + 1}</div>
                        <div className="entry-details">
                          <h4>Entry #{entry.entryNumber}</h4>
                          <p>Used {entry.usageCount} times</p>
                        </div>
                        <div className="entry-stats">
                          <div className="stat">
                            <span className="stat-label">Usage Count</span>
                            <span className="stat-value">{entry.usageCount}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Last Used</span>
                            <span className="stat-value">{getTimeAgo(entry.lastUsed)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">
                      <p>No entry number data available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'leastActive' && (
              <div className="entry-category-section">
                <div className="category-header">
                  <h3>Low Active Entry Numbers</h3>
                  <p>Entry numbers used less than 20 times (Top 5)</p>
                </div>
                <div className="entries-grid">
                  {analyticsData.entryNumberCategories?.leastActive?.length > 0 ? (
                    analyticsData.entryNumberCategories.leastActive.map((entry, index) => (
                      <div key={entry.entryNumber} className="entry-card least-active">
                        <div className="entry-rank">#{index + 1}</div>
                        <div className="entry-details">
                          <h4>Entry #{entry.entryNumber}</h4>
                          <p>Used {entry.usageCount} times</p>
                        </div>
                        <div className="entry-stats">
                          <div className="stat">
                            <span className="stat-label">Usage Count</span>
                            <span className="stat-value">{entry.usageCount}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Last Used</span>
                            <span className="stat-value">{getTimeAgo(entry.lastUsed)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">
                      <p>No entry number data available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;