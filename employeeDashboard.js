// ========================================
// EMPLOYEE DASHBOARD - JAVASCRIPT
// PURPLE & GOLD THEME
// ========================================

// ==================== CONSTANTS & CONFIG ====================
const STORAGE_KEYS = {
  PRODUCTS: 'products',
  REQUESTS: 'productRequests',
  EMPLOYEE_NAME: 'employeeName'
};

const ALERTS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// ==================== STATE MANAGEMENT ====================
let state = {
  products: [],
  requests: [],
  filteredRequests: [],
  currentPage: 1,
  itemsPerPage: 10,
  statusFilter: '',
  employeeName: '',
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    denied: 0,
    forwarded: 0,
    monthlyRequests: 0,
    monthlyApproved: 0,
    monthlyPending: 0,
    approvalRate: 0
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Get today's date in ISO format
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Format date to readable string
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Format date and time
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return date.toLocaleDateString('en-US', options);
}

// Format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return formatDate(dateString);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (text === 0) return '0';
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ==================== STORAGE FUNCTIONS ====================

function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return [];
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

function loadState() {
  state.products = loadFromStorage(STORAGE_KEYS.PRODUCTS);
  state.requests = loadFromStorage(STORAGE_KEYS.REQUESTS);
  state.employeeName = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_NAME) || 'Employee';
  state.filteredRequests = [...state.requests];
}

// ==================== ALERT SYSTEM ====================

function showAlert(message, type = ALERTS.INFO, duration = 5000) {
  const container = document.getElementById('alertContainer');
  if (!container) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} animate-slideInRight`;
  
  const iconMap = {
    [ALERTS.SUCCESS]: 'fa-check-circle',
    [ALERTS.ERROR]: 'fa-exclamation-circle',
    [ALERTS.WARNING]: 'fa-exclamation-triangle',
    [ALERTS.INFO]: 'fa-info-circle'
  };
  
  alertDiv.innerHTML = `
    <i class="fas ${iconMap[type]}"></i>
    <span>${escapeHtml(message)}</span>
  `;
  
  container.appendChild(alertDiv);
  
  // Auto-remove after duration
  setTimeout(() => {
    alertDiv.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => alertDiv.remove(), 300);
  }, duration);
}

// ==================== LOADING OVERLAY ====================

function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.add('show');
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

// ==================== DATE & TIME UPDATE ====================

function updateDateTime() {
  const now = new Date();
  
  // Update date
  const dateOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  const dateString = now.toLocaleDateString('en-US', dateOptions);
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    dateElement.textContent = dateString;
  }
  
  // Update time
  const timeOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };
  const timeString = now.toLocaleTimeString('en-US', timeOptions);
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    timeElement.textContent = timeString;
  }
}

// ==================== STATISTICS CALCULATION ====================

function calculateStats() {
  const requests = state.requests;
  
  // Overall stats
  state.stats.total = requests.length;
  state.stats.pending = requests.filter(r => r.status === 'Pending').length;
  state.stats.approved = requests.filter(r => r.status === 'Approved_Dep').length;
  state.stats.denied = requests.filter(r => r.status === 'Denied').length;
  state.stats.forwarded = requests.filter(r => r.status === 'Forwarded_Inv').length;
  
  // Approval rate
  if (state.stats.total > 0) {
    const approvedTotal = state.stats.approved + state.stats.forwarded;
    state.stats.approvalRate = Math.round((approvedTotal / state.stats.total) * 100);
  } else {
    state.stats.approvalRate = 0;
  }
  
  // Monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRequests = requests.filter(r => {
    const date = new Date(r.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  state.stats.monthlyRequests = monthlyRequests.length;
  state.stats.monthlyApproved = monthlyRequests.filter(r => 
    r.status === 'Approved_Dep' || r.status === 'Forwarded_Inv'
  ).length;
  state.stats.monthlyPending = monthlyRequests.filter(r => r.status === 'Pending').length;
  
  updateStatsDisplay();
}

function updateStatsDisplay() {
  // Update stat cards
  const totalElement = document.getElementById('totalRequests');
  const pendingElement = document.getElementById('pendingRequests');
  const approvedElement = document.getElementById('approvedRequests');
  const deniedElement = document.getElementById('deniedRequests');
  const approvalRateElement = document.getElementById('approvalRate');
  
  if (totalElement) totalElement.textContent = state.stats.total;
  if (pendingElement) pendingElement.textContent = state.stats.pending;
  if (approvedElement) approvedElement.textContent = state.stats.approved;
  if (deniedElement) deniedElement.textContent = state.stats.denied;
  if (approvalRateElement) approvalRateElement.textContent = `${state.stats.approvalRate}%`;
  
  // Update monthly summary
  const monthlyRequestsElement = document.getElementById('monthlyRequests');
  const monthlyApprovedElement = document.getElementById('monthlyApproved');
  const monthlyPendingElement = document.getElementById('monthlyPending');
  
  if (monthlyRequestsElement) monthlyRequestsElement.textContent = state.stats.monthlyRequests;
  if (monthlyApprovedElement) monthlyApprovedElement.textContent = state.stats.monthlyApproved;
  if (monthlyPendingElement) monthlyPendingElement.textContent = state.stats.monthlyPending;
  
  // Update progress
  updateMonthlyProgress();
  
  // Calculate average response time
  calculateAverageResponseTime();
}

function updateMonthlyProgress() {
  const goalTarget = 10; // Default monthly goal
  const goalCurrent = state.stats.monthlyRequests;
  const percentage = Math.min(Math.round((goalCurrent / goalTarget) * 100), 100);
  
  const goalPercentageElement = document.getElementById('goalPercentage');
  const goalProgressElement = document.getElementById('goalProgress');
  const goalCurrentElement = document.getElementById('goalCurrent');
  const goalTargetElement = document.getElementById('goalTarget');
  
  if (goalPercentageElement) goalPercentageElement.textContent = `${percentage}%`;
  if (goalProgressElement) goalProgressElement.style.width = `${percentage}%`;
  if (goalCurrentElement) goalCurrentElement.textContent = goalCurrent;
  if (goalTargetElement) goalTargetElement.textContent = goalTarget;
}

function calculateAverageResponseTime() {
  const approvedRequests = state.requests.filter(r => 
    r.status === 'Approved_Dep' || r.status === 'Forwarded_Inv'
  );
  
  if (approvedRequests.length === 0) {
    const avgElement = document.getElementById('avgResponseTime');
    if (avgElement) avgElement.textContent = 'N/A';
    return;
  }
  
  // Simulate response times (in hours)
  const avgHours = Math.round(Math.random() * 48) + 12;
  const avgElement = document.getElementById('avgResponseTime');
  if (avgElement) {
    if (avgHours < 24) {
      avgElement.textContent = `${avgHours}h`;
    } else {
      avgElement.textContent = `${Math.round(avgHours / 24)}d`;
    }
  }
}

// ==================== TABLE FUNCTIONS ====================

function applyFilters() {
  let filtered = [...state.requests];
  
  // Apply status filter
  if (state.statusFilter) {
    filtered = filtered.filter(r => r.status === state.statusFilter);
  }
  
  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  state.filteredRequests = filtered;
}

function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  
  if (!tbody) return;
  
  // Apply filters
  applyFilters();
  
  const requests = state.filteredRequests;
  
  if (requests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>No Requests Found</h3>
            <p>You haven't submitted any requests yet. Click "New Request" to get started.</p>
          </div>
        </td>
      </tr>
    `;
    updateTableFooter(0, 0, 0);
    return;
  }
  
  // Pagination
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, endIndex);
  
  tbody.innerHTML = paginatedRequests.map((request, index) => `
    <tr class="animate-fadeIn" style="animation-delay: ${index * 0.05}s">
      <td><strong>${escapeHtml(request.id)}</strong></td>
      <td>${escapeHtml(request.productName)}</td>
      <td><strong>${escapeHtml(request.quantity)} ${escapeHtml(request.unit)}</strong></td>
      <td>${formatDate(request.date)}</td>
      <td>${getStatusBadge(request.status)}</td>
      <td>
        <div class="action-btns">
          <button class="action-table-btn" onclick="viewRequestDetails('${request.id}')" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Update table footer
  updateTableFooter(startIndex + 1, Math.min(endIndex, requests.length), requests.length);
  
  // Render pagination
  renderPagination();
}

function getStatusBadge(status) {
  const statusMap = {
    'Pending': { class: 'status-pending', icon: 'fa-clock', text: 'Pending' },
    'Approved_Dep': { class: 'status-approved', icon: 'fa-check-circle', text: 'Approved' },
    'Denied': { class: 'status-denied', icon: 'fa-times-circle', text: 'Denied' },
    'Forwarded_Inv': { class: 'status-forwarded', icon: 'fa-share', text: 'Forwarded' }
  };
  
  const statusInfo = statusMap[status] || statusMap['Pending'];
  
  return `
    <span class="status-badge ${statusInfo.class}">
      <i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}
    </span>
  `;
}

function updateTableFooter(start, end, total) {
  const showingInfo = document.getElementById('showingInfo');
  if (showingInfo) {
    showingInfo.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  
  const totalPages = Math.ceil(state.filteredRequests.length / state.itemsPerPage);
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let paginationHTML = '';
  
  // Previous button
  paginationHTML += `
    <button class="page-btn" onclick="changePage(${state.currentPage - 1})" 
            ${state.currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= state.currentPage - 1 && i <= state.currentPage + 1)
    ) {
      paginationHTML += `
        <button class="page-btn ${i === state.currentPage ? 'active' : ''}" 
                onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
      paginationHTML += `<span class="page-btn" disabled>...</span>`;
    }
  }
  
  // Next button
  paginationHTML += `
    <button class="page-btn" onclick="changePage(${state.currentPage + 1})" 
            ${state.currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  pagination.innerHTML = paginationHTML;
}

function changePage(page) {
  const totalPages = Math.ceil(state.filteredRequests.length / state.itemsPerPage);
  
  if (page < 1 || page > totalPages) return;
  
  state.currentPage = page;
  renderRequestsTable();
  
  // Scroll to top of table
  document.querySelector('.card-table')?.scrollIntoView({ behavior: 'smooth' });
}

// ==================== ACTIVITY TIMELINE ====================

function renderActivityTimeline() {
  const timeline = document.getElementById('activityTimeline');
  if (!timeline) return;
  
  // Get recent activities (last 10)
  const recentActivities = [...state.requests]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  
  if (recentActivities.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-history"></i>
        <p>No recent activity</p>
      </div>
    `;
    return;
  }
  
  timeline.innerHTML = recentActivities.map((request, index) => {
    const iconClass = getActivityIcon(request.status);
    return `
      <div class="timeline-item animate-slideInLeft" style="animation-delay: ${index * 0.1}s">
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-title">
              <span class="timeline-icon ${iconClass}">
                <i class="${getStatusIcon(request.status)}"></i>
              </span>
              ${getActivityTitle(request.status)}
            </span>
            <span class="timeline-time">
              <i class="fas fa-clock"></i>
              ${formatTimeAgo(request.date)}
            </span>
          </div>
          <div class="timeline-description">
            <strong>${escapeHtml(request.productName)}</strong> - 
            ${escapeHtml(request.quantity)} ${escapeHtml(request.unit)}
            <br>
            <small>Request ID: ${escapeHtml(request.id)}</small>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getActivityIcon(status) {
  const iconMap = {
    'Pending': 'icon-warning',
    'Approved_Dep': 'icon-success',
    'Denied': 'icon-danger',
    'Forwarded_Inv': 'icon-info'
  };
  return iconMap[status] || 'icon-info';
}

function getStatusIcon(status) {
  const iconMap = {
    'Pending': 'fas fa-clock',
    'Approved_Dep': 'fas fa-check',
    'Denied': 'fas fa-times',
    'Forwarded_Inv': 'fas fa-share'
  };
  return iconMap[status] || 'fas fa-info';
}

function getActivityTitle(status) {
  const titleMap = {
    'Pending': 'Request Submitted',
    'Approved_Dep': 'Request Approved',
    'Denied': 'Request Denied',
    'Forwarded_Inv': 'Request Forwarded'
  };
  return titleMap[status] || 'Request Updated';
}

// ==================== MODAL FUNCTIONS ====================

function viewRequestDetails(requestId) {
  const request = state.requests.find(r => r.id === requestId);
  
  if (!request) {
    showAlert('Request not found', ALERTS.ERROR);
    return;
  }
  
  const modal = document.getElementById('requestModal');
  const modalBody = document.getElementById('requestModalBody');
  
  if (!modal || !modalBody) return;
  
  modalBody.innerHTML = `
    <div class="detail-section">
      <h4><i class="fas fa-info-circle"></i> Request Information</h4>
      <div class="request-details-grid">
        <div class="detail-item">
          <span class="detail-label">Request ID</span>
          <span class="detail-value">${escapeHtml(request.id)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="detail-value">${getStatusBadge(request.status)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Date Requested</span>
          <span class="detail-value">${formatDateTime(request.date)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Requested By</span>
          <span class="detail-value">${escapeHtml(request.requestedBy)}</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h4><i class="fas fa-box"></i> Product Details</h4>
      <div class="request-details-grid">
        <div class="detail-item">
          <span class="detail-label">Product Name</span>
          <span class="detail-value">${escapeHtml(request.productName)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Quantity</span>
          <span class="detail-value">${escapeHtml(request.quantity)} ${escapeHtml(request.unit)}</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h4><i class="fas fa-comment-alt"></i> Purpose</h4>
      <p>${escapeHtml(request.purpose || 'No purpose specified')}</p>
    </div>
    
    ${request.remarks ? `
      <div class="detail-section">
        <h4><i class="fas fa-sticky-note"></i> Remarks</h4>
        <p>${escapeHtml(request.remarks)}</p>
      </div>
    ` : ''}
  `;
  
  modal.classList.add('show');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

function showExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) {
    modal.classList.add('show');
  }
}

// ==================== EXPORT FUNCTIONS ====================

function exportToCSV() {
  if (state.requests.length === 0) {
    showAlert('No data to export', ALERTS.WARNING);
    return;
  }
  
  const headers = ['Request ID', 'Date', 'Product', 'Quantity', 'Unit', 'Requested By', 'Status', 'Purpose'];
  const rows = state.requests.map(r => [
    r.id,
    formatDate(r.date),
    r.productName,
    r.quantity,
    r.unit,
    r.requestedBy,
    r.status,
    r.purpose || '-'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `employee-requests-${todayISO()}.csv`;
  link.click();
  
  closeModal('exportModal');
  showAlert('✓ CSV exported successfully', ALERTS.SUCCESS);
}

function exportToJSON() {
  if (state.requests.length === 0) {
    showAlert('No data to export', ALERTS.WARNING);
    return;
  }
  
  const dataStr = JSON.stringify(state.requests, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `employee-requests-${todayISO()}.json`;
  link.click();
  
  closeModal('exportModal');
  showAlert('✓ JSON exported successfully', ALERTS.SUCCESS);
}

function exportToPDF() {
  showAlert('PDF export feature coming soon!', ALERTS.INFO);
  closeModal('exportModal');
}

function printDashboard() {
  window.print();
  closeModal('exportModal');
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Refresh dashboard
  const refreshBtn = document.getElementById('refreshDashboard');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showLoading();
      setTimeout(() => {
        loadState();
        calculateStats();
        renderRequestsTable();
        renderActivityTimeline();
        hideLoading();
        showAlert('✓ Dashboard refreshed', ALERTS.SUCCESS, 2000);
      }, 500);
    });
  }
  
  // Refresh table
  const refreshTableBtn = document.getElementById('refreshTable');
  if (refreshTableBtn) {
    refreshTableBtn.addEventListener('click', () => {
      renderRequestsTable();
      showAlert('✓ Table refreshed', ALERTS.SUCCESS, 2000);
    });
  }
  
  // Refresh activity
  const refreshActivityBtn = document.getElementById('refreshActivity');
  if (refreshActivityBtn) {
    refreshActivityBtn.addEventListener('click', () => {
      renderActivityTimeline();
      showAlert('✓ Activity refreshed', ALERTS.SUCCESS, 2000);
    });
  }
  
  // Status filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      state.currentPage = 1;
      renderRequestsTable();
    });
  }
  
  // View all button
  const viewAllBtn = document.getElementById('viewAllBtn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      state.statusFilter = '';
      state.currentPage = 1;
      if (statusFilter) statusFilter.value = '';
      renderRequestsTable();
    });
  }
  
  // Export data button
  const exportDataBtn = document.getElementById('exportDataBtn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', showExportModal);
  }
  
  // Export options
  const exportCSVBtn = document.getElementById('exportCSV');
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', exportToCSV);
  }
  
  const exportJSONBtn = document.getElementById('exportJSON');
  if (exportJSONBtn) {
    exportJSONBtn.addEventListener('click', exportToJSON);
  }
  
  const exportPDFBtn = document.getElementById('exportPDF');
  if (exportPDFBtn) {
    exportPDFBtn.addEventListener('click', exportToPDF);
  }
  
  const exportPrintBtn = document.getElementById('exportPrint');
  if (exportPrintBtn) {
    exportPrintBtn.addEventListener('click', printDashboard);
  }
  
  // Modal close buttons
  const closeRequestModalBtn = document.getElementById('closeRequestModal');
  if (closeRequestModalBtn) {
    closeRequestModalBtn.addEventListener('click', () => closeModal('requestModal'));
  }
  
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => closeModal('requestModal'));
  }
  
  const closeExportModalBtn = document.getElementById('closeExportModal');
  if (closeExportModalBtn) {
    closeExportModalBtn.addEventListener('click', () => closeModal('exportModal'));
  }
  
  // Modal overlay clicks
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        modal.classList.remove('show');
      });
    }
  });
}

// ==================== INITIALIZATION ====================

function initializeDashboard() {
  console.log('🟣✨ Initializing Employee Dashboard (Purple & Gold Theme)...');
  
  // Load state
  loadState();
  
  // Update employee name
  const employeeNameElement = document.getElementById('employeeName');
  if (employeeNameElement) {
    employeeNameElement.textContent = state.employeeName;
  }
  
  // Update date & time
  updateDateTime();
  setInterval(updateDateTime, 1000); // Update every second
  
  // Calculate and display stats
  calculateStats();
  
  // Render components
  renderRequestsTable();
  renderActivityTimeline();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize feather icons if available
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
  
  console.log('✓ Dashboard initialized successfully');
  console.log(`📊 Total Requests: ${state.stats.total}`);
  console.log(`📦 Products: ${state.products.length}`);
  
  // Welcome message
  setTimeout(() => {
    showAlert(`👋 Welcome back, ${state.employeeName}!`, ALERTS.INFO, 3000);
  }, 500);
}

// ==================== KEYBOARD SHORTCUTS ====================

document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + R: Refresh dashboard
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    document.getElementById('refreshDashboard')?.click();
  }
  
  // Escape: Close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      modal.classList.remove('show');
    });
  }
  
  // Ctrl/Cmd + E: Export modal
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    showExportModal();
  }
});

// ==================== PAGE VISIBILITY ====================

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadState();
    calculateStats();
    renderRequestsTable();
    renderActivityTimeline();
  }
});

// ==================== ERROR HANDLING ====================

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showAlert('An unexpected error occurred. Please refresh the page.', ALERTS.ERROR);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showAlert('An unexpected error occurred. Please try again.', ALERTS.ERROR);
});

// ==================== DOM READY ====================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}

// ==================== EXPOSE FUNCTIONS TO GLOBAL SCOPE ====================

window.changePage = changePage;
window.viewRequestDetails = viewRequestDetails;

// ==================== CONSOLE WELCOME MESSAGE ====================

console.log('%c🟣✨ LIONG Employee Dashboard ', 'background: linear-gradient(135deg, #7c3aed, #fbbf24); color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;');
console.log('%cPurple & Gold Theme Edition', 'color: #7c3aed; font-weight: bold; font-size: 14px;');
console.log('%cVersion 1.0.0', 'color: #6b7280; font-size: 12px;');
console.log('');
console.log('💡 %cKeyboard Shortcuts:', 'font-weight: bold;');
console.log('   %cCtrl/Cmd + R%c: Refresh dashboard', 'background: #f3e8ff; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('   %cCtrl/Cmd + E%c: Export data', 'background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('   %cEsc%c: Close modals', 'background: #f3e8ff; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('');
console.log('🎨 Theme Colors: Purple (#7c3aed) & Gold (#fbbf24)');
console.log('📊 Dashboard loaded successfully!');
console.log('');

// ==================== END OF FILE ====================