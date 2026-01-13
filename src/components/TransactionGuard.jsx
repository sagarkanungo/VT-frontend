import { useState, useEffect } from 'react';
import { isTransactionAllowed, getCurrentTime } from '../../utils/timeUtils';
import { FiClock, FiAlertCircle } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import './TransactionGuard.css';

const TransactionGuard = ({ children, onStatusChange }) => {
  const [transactionStatus, setTransactionStatus] = useState({ allowed: true, message: '' });
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTransactionStatus();
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    
    // Check transaction status every minute
    const statusInterval = setInterval(() => {
      checkTransactionStatus();
    }, 60000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(transactionStatus.allowed);
    }
  }, [transactionStatus.allowed, onStatusChange]);

  const checkTransactionStatus = async () => {
    ('🛡️ TransactionGuard: Checking transaction status...');
    try {
      const status = await isTransactionAllowed();
      ('🛡️ TransactionGuard: Status received:', status);
      setTransactionStatus(status);
    } catch (error) {
      console.error('🛡️ TransactionGuard: Error checking transaction status:', error);
      setTransactionStatus({ allowed: true, message: '' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="transaction-guard-loading">
        <LoadingSpinner message="Checking transaction availability..." size="medium" />
      </div>
    );
  }

  if (!transactionStatus.allowed) {
    return (
      <div className="transaction-guard-blocked">
        <div className="blocked-content">
          <div className="blocked-icon">
            <FiClock size={48} />
          </div>
          <h3>Transactions Currently Unavailable</h3>
          <p className="blocked-message">{transactionStatus.message}</p>
          <div className="current-time">
            <FiAlertCircle size={16} />
            <span>Current Time: {currentTime}</span>
          </div>
          <div className="blocked-note">
            <p>This page will automatically refresh when transactions become available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-guard-allowed">
      {children}
    </div>
  );
};

export default TransactionGuard;