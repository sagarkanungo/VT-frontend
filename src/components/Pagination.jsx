import React from 'react';
import './Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage = 10, 
  onPageChange,
  onItemsPerPageChange,
  showInfo = true,
  showItemsPerPageSelector = false,
  itemsPerPageOptions = [5, 10, 25, 50]
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-left">
        {showInfo && (
          <div className="pagination-info">
            Showing {startItem} to {endItem} of {totalItems} entries
          </div>
        )}
        
        {showItemsPerPageSelector && onItemsPerPageChange && (
          <div className="items-per-page-selector">
            <label htmlFor="itemsPerPage">Show:</label>
            <select 
              id="itemsPerPage"
              value={itemsPerPage} 
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              className="items-per-page-select"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span>entries</span>
          </div>
        )}
      </div>
      
      <div className="pagination-controls">
        <button
          className="pagination-btn pagination-prev"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>

        <div className="pagination-numbers">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              className={`pagination-btn ${
                page === currentPage ? 'pagination-active' : ''
              } ${page === '...' ? 'pagination-dots' : ''}`}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          className="pagination-btn pagination-next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;