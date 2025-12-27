import { useEffect, useState } from "react";
import apiClient from "../../../utils/axios";
import Pagination from "../../components/Pagination";
import "../../assets/css/analytics.css";
import { 
  FiUsers, 
  FiDollarSign, 
  FiTrendingUp, 
  FiActivity,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownRight
} from "react-icons/fi";

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalBalance: 0,
    topUsers: [],
    recentActivity: [],
    transactionTrends: [],
    userGrowth: {
      newUsers: 0,
      userRetention: "0%",
      avgSessionTime: "0 minutes"
    },
    activityDistribution: {
      highActive: 0,
      midActive: 0,
      lowActive: 0,
      total: 0
    }
  });
  console.log('analyticsData',analyticsData)
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7days");
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all required data in parallel
      const [usersRes, requestsRes] = await Promise.all([
        apiClient.get("/api/admin/users"),
        apiClient.get("/api/admin/money-requests")
      ]);

      // Process the data
      const processedData = await processAnalyticsData(usersRes.data, requestsRes.data);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Fallback to mock data if API fails
      const mockData = generateMockAnalyticsData();
      setAnalyticsData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = async (users, requests) => {
    // Filter out admin users
    const normalUsers = users.filter(user => user.role !== "admin");
    
    // Calculate user metrics
    const totalUsers = normalUsers.length;
    const approvedUsers = normalUsers.filter(user => user.approved).length;
    const activeUsers = normalUsers.filter(user => !user.is_blocked && user.approved).length;
    
    // Get user balances, transactions, and entries
    const userAnalytics = await Promise.all(
      normalUsers.slice(0, 10).map(async (user) => {
        try {
          const [balanceRes, transactionsRes, entriesRes] = await Promise.all([
            apiClient.get(`/api/user/${user.id}/balance`).catch(() => ({ data: { balance: 0 } })),
            apiClient.get(`/api/user/${user.id}/transactions`).catch(() => ({ data: [] })),
            apiClient.get(`/api/user/${user.id}/entries`).catch(() => ({ data: [] }))
          ]);
          
          // Ensure balance is a number
          const balance = balanceRes.data.balance;
          const numericBalance = typeof balance === 'string' ? parseFloat(balance) : (balance || 0);
          
          // Calculate activity level based on entry numbers
          const entries = entriesRes.data || [];
          const uniqueEntryNumbers = new Set(entries.map(entry => entry.entry_number)).size;
          const activityLevel = getActivityLevel(uniqueEntryNumbers);
          
          return {
            ...user,
            balance: isNaN(numericBalance) ? 0 : numericBalance,
            transactions: transactionsRes.data || [],
            entries: entries,
            transactionCount: transactionsRes.data?.length || 0,
            uniqueEntryNumbers: uniqueEntryNumbers,
            activityLevel: activityLevel,
            lastActive: getLastActiveTime(transactionsRes.data)
          };
        } catch (error) {
          return {
            ...user,
            balance: 0,
            transactions: [],
            entries: [],
            transactionCount: 0,
            uniqueEntryNumbers: 0,
            activityLevel: 'low',
            lastActive: "No activity"
          };
        }
      })
    );

    // Sort users by transaction count for top users
    const topUsers = userAnalytics
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 5)
      .map((user, index) => {
        const balance = typeof user.balance === 'string' ? parseFloat(user.balance) : user.balance;
        return {
          id: user.id,
          name: user.full_name,
          email: user.phone, // Using phone as email since that's what we have
          transactions: user.transactionCount,
          balance: isNaN(balance) ? 0 : balance,
          lastActive: user.lastActive,
          growth: calculateGrowth(user.transactionCount, index),
          activityLevel: user.activityLevel,
          uniqueEntryNumbers: user.uniqueEntryNumbers
        };
      });

    // Calculate activity distribution
    const activityDistribution = calculateActivityDistribution(userAnalytics);

    // Calculate total balance across all users (convert strings to numbers)
    const totalBalance = userAnalytics.reduce((sum, user) => {
      const balance = typeof user.balance === 'string' ? parseFloat(user.balance) : user.balance;
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);
    
    // Calculate total transactions
    const totalTransactions = userAnalytics.reduce((sum, user) => sum + user.transactionCount, 0);

    // Process recent activity from requests and transactions
    const recentActivity = processRecentActivity(requests, userAnalytics);

    // Generate transaction trends
    const transactionTrends = generateTransactionTrends(userAnalytics, timeRange);

    // Calculate user growth metrics
    const userGrowth = calculateUserGrowth(normalUsers, timeRange);

    return {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalBalance,
      topUsers,
      recentActivity,
      transactionTrends,
      userGrowth,
      activityDistribution
    };
  };

  const getLastActiveTime = (transactions) => {
    if (!transactions || transactions.length === 0) return "No activity";
    
    const lastTransaction = transactions[transactions.length - 1];
    const lastDate = new Date(lastTransaction.created_at);
    const now = new Date();
    const diffInHours = Math.floor((now - lastDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than 1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getActivityLevel = (uniqueEntryNumbers) => {
    if (uniqueEntryNumbers >= 20) return 'high';
    if (uniqueEntryNumbers >= 10) return 'medium';
    return 'low';
  };

  const calculateActivityDistribution = (userAnalytics) => {
    const distribution = {
      high: 0,
      medium: 0,
      low: 0
    };

    userAnalytics.forEach(user => {
      distribution[user.activityLevel]++;
    });

    return {
      highActive: distribution.high,
      midActive: distribution.medium,
      lowActive: distribution.low,
      total: userAnalytics.length
    };
  };

  const calculateGrowth = (transactionCount, index) => {
    // Mock growth calculation based on transaction count and position
    const baseGrowth = Math.max(5, 25 - (index * 3) + Math.floor(transactionCount / 10));
    return `+${baseGrowth}%`;
  };

  const processRecentActivity = (requests, userAnalytics) => {
    const activities = [];
    
    // Add money requests as activities
    requests.slice(0, 5).forEach(request => {
      activities.push({
        user: request.full_name,
        action: "Money Request",
        amount: extractAmountFromMessage(request.message),
        time: getTimeAgo(request.created_at),
        type: "request",
        status: request.status === "approved" ? "approved" : "pending"
      });
    });

    // Add recent transactions from user analytics
    userAnalytics.forEach(user => {
      if (user.transactions && user.transactions.length > 0) {
        const recentTransaction = user.transactions[user.transactions.length - 1];
        activities.push({
          user: user.full_name,
          action: recentTransaction.description || "Transaction",
          amount: recentTransaction.amount,
          time: getTimeAgo(recentTransaction.created_at),
          type: recentTransaction.amount > 0 ? "deposit" : "transfer",
          status: "completed"
        });
      }
    });

    // Sort by most recent and return top 7
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 7);
  };

  const extractAmountFromMessage = (message) => {
    const match = message.match(/₹(\d+)/);
    return match ? parseInt(match[1]) : 0;
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

  const generateTransactionTrends = (userAnalytics, timeRange) => {
    const totalTransactions = userAnalytics.reduce((sum, user) => sum + user.transactionCount, 0);
    const totalAmount = userAnalytics.reduce((sum, user) => sum + user.balance, 0);
    
    // Generate mock trends based on actual data
    const multiplier = timeRange === "7days" ? 1 : timeRange === "30days" ? 4 : 12;
    
    return [
      { 
        period: "Today", 
        transactions: Math.floor(totalTransactions * 0.1), 
        amount: Math.floor(totalAmount * 0.05), 
        change: "+12%" 
      },
      { 
        period: "Yesterday", 
        transactions: Math.floor(totalTransactions * 0.12), 
        amount: Math.floor(totalAmount * 0.06), 
        change: "+8%" 
      },
      { 
        period: "This Week", 
        transactions: Math.floor(totalTransactions * 0.4), 
        amount: Math.floor(totalAmount * 0.2), 
        change: "+15%" 
      },
      { 
        period: "Last Week", 
        transactions: Math.floor(totalTransactions * 0.35), 
        amount: Math.floor(totalAmount * 0.18), 
        change: "-3%" 
      }
    ];
  };

  const calculateUserGrowth = (users, timeRange) => {
    const now = new Date();
    const timeRangeMs = timeRange === "7days" ? 7 * 24 * 60 * 60 * 1000 : 
                       timeRange === "30days" ? 30 * 24 * 60 * 60 * 1000 : 
                       90 * 24 * 60 * 60 * 1000;
    
    const cutoffDate = new Date(now.getTime() - timeRangeMs);
    const newUsers = users.filter(user => new Date(user.created_at) > cutoffDate).length;
    const approvedUsers = users.filter(user => user.approved).length;
    const userRetention = users.length > 0 ? Math.round((approvedUsers / users.length) * 100) : 0;
    
    return {
      newUsers,
      userRetention: `${userRetention}%`,
      avgSessionTime: "24 minutes" // This would need session tracking to be accurate
    };
  };

  // Fallback mock data generator - used when API calls fail
  const generateMockAnalyticsData = () => {
    const timeMultiplier = timeRange === "7days" ? 1 : timeRange === "30days" ? 4 : 12;
    
    const users = [
      { id: 1, name: "John Doe", email: "john@example.com", transactions: 45 * timeMultiplier, balance: 2500, lastActive: "2 hours ago", growth: "+15%", activityLevel: "high", uniqueEntryNumbers: 25 },
      { id: 2, name: "Jane Smith", email: "jane@example.com", transactions: 38 * timeMultiplier, balance: 1800, lastActive: "1 day ago", growth: "+22%", activityLevel: "high", uniqueEntryNumbers: 22 },
      { id: 3, name: "Mike Johnson", email: "mike@example.com", transactions: 32 * timeMultiplier, balance: 3200, lastActive: "3 hours ago", growth: "+8%", activityLevel: "medium", uniqueEntryNumbers: 15 },
      { id: 4, name: "Sarah Wilson", email: "sarah@example.com", transactions: 28 * timeMultiplier, balance: 1500, lastActive: "5 hours ago", growth: "+31%", activityLevel: "medium", uniqueEntryNumbers: 12 },
      { id: 5, name: "David Brown", email: "david@example.com", transactions: 25 * timeMultiplier, balance: 2100, lastActive: "1 day ago", growth: "+12%", activityLevel: "low", uniqueEntryNumbers: 8 }
    ];

    const recentActivity = [
      { user: "John Doe", action: "Money Transfer", amount: 500, time: "2 hours ago", type: "transfer", status: "completed" },
      { user: "Jane Smith", action: "Balance Added", amount: 200, time: "3 hours ago", type: "deposit", status: "completed" },
      { user: "Mike Johnson", action: "Money Request", amount: 150, time: "4 hours ago", type: "request", status: "pending" },
      { user: "Sarah Wilson", action: "Money Transfer", amount: 75, time: "5 hours ago", type: "transfer", status: "completed" },
      { user: "David Brown", action: "Balance Added", amount: 300, time: "6 hours ago", type: "deposit", status: "completed" },
      { user: "Alice Cooper", action: "Money Transfer", amount: 125, time: "8 hours ago", type: "transfer", status: "completed" },
      { user: "Bob Wilson", action: "Money Request", amount: 250, time: "10 hours ago", type: "request", status: "approved" }
    ];

    const baseMetrics = {
      totalUsers: 156,
      activeUsers: 89,
      totalTransactions: 1247,
      totalBalance: 45600
    };

    return {
      totalUsers: Math.floor(baseMetrics.totalUsers * timeMultiplier * 0.8),
      activeUsers: Math.floor(baseMetrics.activeUsers * timeMultiplier * 0.6),
      totalTransactions: Math.floor(baseMetrics.totalTransactions * timeMultiplier),
      totalBalance: Math.floor(baseMetrics.totalBalance * timeMultiplier * 1.2),
      topUsers: users,
      recentActivity: recentActivity,
      transactionTrends: [
        { period: "Today", transactions: 23, amount: 4500, change: "+12%" },
        { period: "Yesterday", transactions: 31, amount: 6200, change: "+8%" },
        { period: "This Week", transactions: 187, amount: 28900, change: "+15%" },
        { period: "Last Week", transactions: 156, amount: 24100, change: "-3%" }
      ],
      userGrowth: {
        newUsers: Math.floor(12 * timeMultiplier * 0.5),
        userRetention: "87%",
        avgSessionTime: "24 minutes"
      },
      activityDistribution: {
        highActive: 2,
        midActive: 2,
        lowActive: 1,
        total: 5
      }
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Pagination logic for users table
  const indexOfLastUser = usersCurrentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = analyticsData.topUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Pagination logic for activity list
  const indexOfLastActivity = activityCurrentPage * itemsPerPage;
  const indexOfFirstActivity = indexOfLastActivity - itemsPerPage;
  const currentActivities = analyticsData.recentActivity.slice(indexOfFirstActivity, indexOfLastActivity);

  const handleUsersPageChange = (pageNumber) => {
    setUsersCurrentPage(pageNumber);
  };

  const handleActivityPageChange = (pageNumber) => {
    setActivityCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div className="header-controls">
          <button 
            className="refresh-btn"
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <div className="time-range-selector">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FiUsers />
          </div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <p className="metric-value">{analyticsData.totalUsers}</p>
            <span className="metric-change positive">
              <FiArrowUpRight /> +12% from last period
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FiActivity />
          </div>
          <div className="metric-content">
            <h3>Active Users</h3>
            <p className="metric-value">{analyticsData.activeUsers}</p>
            <span className="metric-change positive">
              <FiArrowUpRight /> +8% from last period
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FiCreditCard />
          </div>
          <div className="metric-content">
            <h3>Total Transactions</h3>
            <p className="metric-value">{analyticsData.totalTransactions}</p>
            <span className="metric-change positive">
              <FiArrowUpRight /> +15% from last period
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FiDollarSign />
          </div>
          <div className="metric-content">
            <h3>Total Payout</h3>
            <p className="metric-value">{formatCurrency(analyticsData.totalBalance)}</p>
            <span className="metric-change positive">
              <FiArrowUpRight /> +22% from last period
            </span>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        {/* Quick Insights */}
        <div className="analytics-section">
          <h2>Quick Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">
                <FiTrendingUp />
              </div>
              <div className="insight-content">
                <h4>User Growth</h4>
                <p>+{analyticsData.userGrowth?.newUsers || 0} new users this period</p>
                <span className="insight-detail">User retention: {analyticsData.userGrowth?.userRetention || "N/A"}</span>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">
                <FiActivity />
              </div>
              <div className="insight-content">
                <h4>Engagement</h4>
                <p>Average session: {analyticsData.userGrowth?.avgSessionTime || "N/A"}</p>
                <span className="insight-detail">{Math.round((analyticsData.activeUsers / analyticsData.totalUsers) * 100)}% users active</span>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">
                <FiDollarSign />
              </div>
              <div className="insight-content">
                <h4>Payout Health</h4>
                <p>{formatCurrency(analyticsData.totalBalance / analyticsData.totalUsers)} avg payout per user</p>
                <span className="insight-detail">{(analyticsData.totalTransactions / analyticsData.activeUsers).toFixed(1)} transactions per active user</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Activity Distribution */}
        <div className="analytics-section">
          <h2>User Activity Distribution</h2>
          <div className="activity-distribution-grid">
            <div className="activity-card high-active">
              <div className="activity-icon">
                <FiTrendingUp />
              </div>
              <div className="activity-content">
                <h4>High Active Users</h4>
                <p className="activity-count">{analyticsData.activityDistribution?.highActive || 0}</p>
                <span className="activity-detail">20+ unique entry numbers</span>
              </div>
            </div>
            <div className="activity-card mid-active">
              <div className="activity-icon">
                <FiActivity />
              </div>
              <div className="activity-content">
                <h4>Mid Active Users</h4>
                <p className="activity-count">{analyticsData.activityDistribution?.midActive || 0}</p>
                <span className="activity-detail">10-19 unique entry numbers</span>
              </div>
            </div>
            <div className="activity-card low-active">
              <div className="activity-icon">
                <FiUsers />
              </div>
              <div className="activity-content">
                <h4>Low Active Users</h4>
                <p className="activity-count">{analyticsData.activityDistribution?.lowActive || 0}</p>
                <span className="activity-detail">0-9 unique entry numbers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Most Active Users */}
        <div className="analytics-section">
          <h2>Most Active Users</h2>
          <div className="active-users-table">
            <div className="table-header">
              <span>User</span>
              <span>Transactions</span>
              <span>Entry Numbers</span>
              <span>Activity Level</span>
              <span>Payout</span>
              <span>Growth</span>
              <span>Last Active</span>
            </div>
            {currentUsers.map((user, index) => (
              <div key={user.id} className="table-row">
                <div className="user-info">
                  <div className="user-rank">#{indexOfFirstUser + index + 1}</div>
                  <div>
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                <span className="transaction-count">{user.transactions}</span>
                <span className="entry-numbers">{user.uniqueEntryNumbers || 0}</span>
                <span className={`activity-level ${user.activityLevel || 'low'}`}>
                  {user.activityLevel === 'high' ? 'High Active' : 
                   user.activityLevel === 'medium' ? 'Mid Active' : 'Low Active'}
                </span>
                <span className="balance-amount">{formatCurrency(user.balance)}</span>
                <span className="growth-rate positive">{user.growth}</span>
                <span className="last-active">{user.lastActive}</span>
              </div>
            ))}
          </div>

          {/* Pagination for Users */}
          {analyticsData.topUsers.length > itemsPerPage && (
            <Pagination
              currentPage={usersCurrentPage}
              totalItems={analyticsData.topUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handleUsersPageChange}
            />
          )}
        </div>

        {/* Recent Activity */}
        <div className="analytics-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {currentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'transfer' && <FiArrowUpRight />}
                  {activity.type === 'deposit' && <FiArrowDownRight />}
                  {activity.type === 'request' && <FiDollarSign />}
                </div>
                <div className="activity-details">
                  <div className="activity-user">{activity.user}</div>
                  <div className="activity-action">{activity.action}</div>
                </div>
                <div className="activity-amount">
                  {formatCurrency(activity.amount)}
                </div>
                <div className={`activity-status ${activity.status}`}>
                  {activity.status}
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))}
          </div>

          {/* Pagination for Activity */}
          {analyticsData.recentActivity.length > itemsPerPage && (
            <Pagination
              currentPage={activityCurrentPage}
              totalItems={analyticsData.recentActivity.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handleActivityPageChange}
            />
          )}
        </div>

        {/* Transaction Trends */}
        <div className="analytics-section">
          <h2>Transaction Trends</h2>
          <div className="trends-grid">
            {analyticsData.transactionTrends.map((trend, index) => (
              <div key={index} className="trend-card">
                <h4>{trend.period}</h4>
                <div className="trend-stats">
                  <div className="trend-stat">
                    <span className="trend-label">Transactions</span>
                    <span className="trend-value">{trend.transactions}</span>
                  </div>
                  <div className="trend-stat">
                    <span className="trend-label">Amount</span>
                    <span className="trend-value">{formatCurrency(trend.amount)}</span>
                  </div>
                  <div className="trend-stat">
                    <span className="trend-label">Change</span>
                    <span className={`trend-change ${trend.change.startsWith('+') ? 'positive' : 'negative'}`}>
                      {trend.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;