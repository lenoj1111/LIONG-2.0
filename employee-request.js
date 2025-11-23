// ========================================
// EMPLOYEE REQUEST - JAVASCRIPT
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
  filteredProducts: [],
  selectedProduct: null,
  currentEmployeeName: ''
};

// ==================== UTILITY FUNCTIONS ====================

// Generate unique ID
function generateId(prefix = 'REQ') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
}

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
  state.currentEmployeeName = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_NAME) || '';
  state.filteredProducts = [...state.products];
}

function saveProducts() {
  saveToStorage(STORAGE_KEYS.PRODUCTS, state.products);
}

function saveRequests() {
  saveToStorage(STORAGE_KEYS.REQUESTS, state.requests);
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

// ==================== PRODUCT FUNCTIONS ====================

function filterProducts(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  
  if (!term) {
    state.filteredProducts = [...state.products];
  } else {
    state.filteredProducts = state.products.filter(product =>
      product.name.toLowerCase().includes(term)
    );
  }
  
  populateProductSelect();
}

function populateProductSelect() {
  const productSelect = document.getElementById('productSelect');
  const productHint = document.getElementById('productHint');
  
  if (!productSelect) return;
  
  productSelect.innerHTML = '<option value="">-- Select a product --</option>';
  
  if (state.products.length === 0) {
    if (productHint) {
      productHint.style.display = 'flex';
    }
    return;
  }
  
  if (productHint) {
    productHint.style.display = 'none';
  }
  
  state.filteredProducts.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = `${product.name} — ${product.unit} (Available: ${product.quantity})`;
    option.dataset.productId = product.id;
    productSelect.appendChild(option);
  });
}

function handleProductSelection(productId) {
  const product = state.products.find(p => p.id === productId);
  
  if (!product) {
    hideProductInfo();
    return;
  }
  
  state.selectedProduct = product;
  showProductInfo(product);
}

function showProductInfo(product) {
  const infoCard = document.getElementById('productInfoCard');
  if (!infoCard) return;
  
  document.getElementById('displayProductName').textContent = product.name;
  document.getElementById('displayUnit').textContent = product.unit;
  document.getElementById('displayQuantity').textContent = product.quantity;
  
  infoCard.style.display = 'block';
  infoCard.classList.add('animate-slideDown');
}

function hideProductInfo() {
  const infoCard = document.getElementById('productInfoCard');
  if (infoCard) {
    infoCard.style.display = 'none';
  }
  state.selectedProduct = null;
}

// ==================== QUANTITY CONTROLS ====================

function setupQuantityControls() {
  const decreaseBtn = document.getElementById('decreaseQty');
  const increaseBtn = document.getElementById('increaseQty');
  const qtyInput = document.getElementById('requestQuantity');
  
  if (decreaseBtn && qtyInput) {
    decreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(qtyInput.value) || 1;
      if (currentValue > 1) {
        qtyInput.value = currentValue - 1;
      }
    });
  }
  
  if (increaseBtn && qtyInput) {
    increaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(qtyInput.value) || 0;
      const maxQty = state.selectedProduct ? parseInt(state.selectedProduct.quantity) : 9999;
      if (currentValue < maxQty) {
        qtyInput.value = currentValue + 1;
      } else {
        showAlert('Cannot exceed available quantity', ALERTS.WARNING);
      }
    });
  }
  
  if (qtyInput) {
    qtyInput.addEventListener('input', () => {
      const value = parseInt(qtyInput.value);
      if (value < 1) {
        qtyInput.value = 1;
      }
      
      if (state.selectedProduct) {
        const maxQty = parseInt(state.selectedProduct.quantity);
        if (value > maxQty) {
          qtyInput.value = maxQty;
          showAlert(`Maximum available quantity is ${maxQty}`, ALERTS.WARNING);
        }
      }
    });
  }
}

// ==================== CHARACTER COUNTER ====================

function setupCharacterCounter() {
  const purposeInput = document.getElementById('requestPurpose');
  const charCount = document.getElementById('charCount');
  
  if (purposeInput && charCount) {
    purposeInput.addEventListener('input', () => {
      const length = purposeInput.value.length;
      charCount.textContent = length;
      
      if (length > 450) {
        charCount.style.color = '#ef4444';
      } else if (length > 400) {
        charCount.style.color = '#f59e0b';
      } else {
        charCount.style.color = 'inherit';
      }
    });
  }
}

// ==================== FORM SUBMISSION ====================

function handleFormSubmit(event) {
  event.preventDefault();
  
  // Get form values
  const requestedBy = document.getElementById('requestedByOut').value.trim();
  const productId = document.getElementById('productSelect').value;
  const quantity = parseInt(document.getElementById('requestQuantity').value) || 0;
  const purpose = document.getElementById('requestPurpose').value.trim();
  
  // Validation
  if (!requestedBy) {
    showAlert('Please enter your name', ALERTS.ERROR);
    document.getElementById('requestedByOut').focus();
    return;
  }
  
  if (!productId) {
    showAlert('Please select a product', ALERTS.ERROR);
    document.getElementById('productSelect').focus();
    return;
  }
  
  if (quantity <= 0) {
    showAlert('Quantity must be at least 1', ALERTS.ERROR);
    document.getElementById('requestQuantity').focus();
    return;
  }
  
  const product = state.products.find(p => p.id === productId);
  
  if (!product) {
    showAlert('Selected product not found', ALERTS.ERROR);
    return;
  }
  
  if (quantity > parseInt(product.quantity)) {
    showAlert(`Insufficient product quantity. Available: ${product.quantity}`, ALERTS.ERROR);
    return;
  }
  
  // Show loading
  showLoading();
  
  // Simulate API delay
  setTimeout(() => {
    try {
      // Update product quantity
      product.quantity = parseInt(product.quantity) - quantity;
      saveProducts();
      
      // Create request record
      const request = {
        id: generateId('REQ'),
        date: new Date().toISOString(),
        requestedBy: requestedBy,
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        type: 'out',
        quantity: quantity,
        purpose: purpose || 'No purpose specified',
        status: 'Pending'
      };
      
      state.requests.push(request);
      saveRequests();
      
      // Save employee name for future use
      localStorage.setItem(STORAGE_KEYS.EMPLOYEE_NAME, requestedBy);
      state.currentEmployeeName = requestedBy;
      
      hideLoading();
      
      // Show success modal
      showSuccessModal(request);
      
      // Reset form
      document.getElementById('requestForm').reset();
      document.getElementById('charCount').textContent = '0';
      hideProductInfo();
      
      // Refresh UI
      populateProductSelect();
      renderRecentRequests();
      updateStats();
      
      showAlert(`✓ Request submitted successfully! ID: ${request.id}`, ALERTS.SUCCESS);
      
    } catch (error) {
      hideLoading();
      console.error('Error submitting request:', error);
      showAlert('Failed to submit request. Please try again.', ALERTS.ERROR);
    }
  }, 800);
}

// ==================== SUCCESS MODAL ====================

function showSuccessModal(request) {
  const modal = document.getElementById('successModal');
  if (!modal) return;
  
  // Populate modal data
  document.getElementById('modalRequestId').textContent = request.id;
  document.getElementById('modalProduct').textContent = request.productName;
  document.getElementById('modalQuantity').textContent = `${request.quantity} ${request.unit}`;
  document.getElementById('modalRequestedBy').textContent = request.requestedBy;
  document.getElementById('modalDate').textContent = formatDateTime(request.date);
  
  // Show modal
  modal.classList.add('show');
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// ==================== RECENT REQUESTS ====================

function renderRecentRequests() {
  const container = document.getElementById('recentRequestsList');
  if (!container) return;
  
  // Get recent requests (last 5)
  const recentRequests = [...state.requests]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  if (recentRequests.length === 0) {
    container.innerHTML = `
      <div class="empty-state animate-fadeIn">
        <i class="fas fa-inbox"></i>
        <p>No recent requests yet</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = recentRequests.map((request, index) => `
    <div class="request-item animate-slideInLeft" style="animation-delay: ${index * 0.1}s">
      <div class="request-header">
        <span class="request-id">${escapeHtml(request.id)}</span>
        <span class="request-date">
          <i class="fas fa-calendar-alt"></i>
          ${formatDate(request.date)}
        </span>
      </div>
      <div class="request-details">
        <div class="request-product">${escapeHtml(request.productName)}</div>
        <div class="request-meta">
          <i class="fas fa-box"></i>
          ${escapeHtml(request.quantity)} ${escapeHtml(request.unit)} 
          • 
          <i class="fas fa-user"></i>
          ${escapeHtml(request.requestedBy)}
        </div>
      </div>
    </div>
  `).join('');
}

// ==================== STATISTICS ====================

function updateStats() {
  const total = state.requests.length;
  
  const today = state.requests.filter(r => {
    const requestDate = new Date(r.date).toDateString();
    const todayDate = new Date().toDateString();
    return requestDate === todayDate;
  }).length;
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = state.requests.filter(r => new Date(r.date) >= weekAgo).length;
  
  const statTotal = document.getElementById('statTotal');
  const statToday = document.getElementById('statToday');
  const statWeek = document.getElementById('statWeek');
  
  if (statTotal) statTotal.textContent = total;
  if (statToday) statToday.textContent = today;
  if (statWeek) statWeek.textContent = thisWeek;
}

// ==================== HISTORY MODAL ====================

function showHistoryModal() {
  const modal = document.getElementById('historyModal');
  if (!modal) return;
  
  renderHistoryTable();
  modal.classList.add('show');
}

function closeHistoryModal() {
  const modal = document.getElementById('historyModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function renderHistoryTable(searchTerm = '') {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  
  let filteredRequests = [...state.requests];
  
  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredRequests = filteredRequests.filter(r =>
      r.id.toLowerCase().includes(term) ||
      r.productName.toLowerCase().includes(term) ||
      r.requestedBy.toLowerCase().includes(term)
    );
  }
  
  // Sort by date (newest first)
  filteredRequests.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (filteredRequests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem;">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No requests found</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filteredRequests.map(request => `
    <tr>
      <td><strong>${escapeHtml(request.id)}</strong></td>
      <td>${formatDate(request.date)}</td>
      <td>${escapeHtml(request.productName)}</td>
      <td><strong>${escapeHtml(request.quantity)} ${escapeHtml(request.unit)}</strong></td>
      <td>${escapeHtml(request.requestedBy)}</td>
      <td>${escapeHtml(request.purpose || '-')}</td>
    </tr>
  `).join('');
}

// ==================== EXPORT FUNCTIONALITY ====================

function exportToCSV() {
  if (state.requests.length === 0) {
    showAlert('No data to export', ALERTS.WARNING);
    return;
  }
  
  // CSV headers
  const headers = ['Request ID', 'Date', 'Product', 'Quantity', 'Unit', 'Requested By', 'Purpose'];
  
  // CSV rows
  const rows = state.requests.map(r => [
    r.id,
    formatDate(r.date),
    r.productName,
    r.quantity,
    r.unit,
    r.requestedBy,
    r.purpose || '-'
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `employee-requests-${todayISO()}.csv`;
  link.click();
  
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
  
  showAlert('✓ JSON exported successfully', ALERTS.SUCCESS);
}

function printHistory() {
  const printWindow = window.open('', '_blank');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee Requests - ${formatDate(new Date())}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 30px;
          color: #1f2937;
        }
        h1 { 
          color: #7c3aed;
          border-bottom: 4px solid #fbbf24;
          padding-bottom: 15px;
          margin-bottom: 10px;
        }
        .meta {
          color: #6b7280;
          font-size: 0.95em;
          margin-bottom: 30px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
        }
        th, td { 
          border: 1px solid #e5e7eb; 
          padding: 12px; 
          text-align: left; 
        }
        th { 
          background: linear-gradient(135deg, #7c3aed, #fbbf24);
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background-color: #faf5ff; 
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #9ca3af;
          font-size: 0.875em;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>🟣 Employee Product Requests</h1>
      <div class="meta">
        <p><strong>Generated:</strong> ${formatDateTime(new Date())}</p>
        <p><strong>Total Requests:</strong> ${state.requests.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Date</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Requested By</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          ${state.requests.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.id)}</strong></td>
              <td>${formatDate(r.date)}</td>
              <td>${escapeHtml(r.productName)}</td>
              <td><strong>${escapeHtml(r.quantity)} ${escapeHtml(r.unit)}</strong></td>
              <td>${escapeHtml(r.requestedBy)}</td>
              <td>${escapeHtml(r.purpose || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>LIONG Employee Request System - Purple & Gold Theme</p>
        <p>Printed on ${formatDateTime(new Date())}</p>
      </div>
      
      <button onclick="window.print()" style="
        margin-top: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #7c3aed, #fbbf24);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">🖨️ Print Document</button>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  showAlert('✓ Print preview opened', ALERTS.INFO);
}

// ==================== EVENT LISTENERS SETUP ====================

function setupEventListeners() {
  // Form submission
  const requestForm = document.getElementById('requestForm');
  if (requestForm) {
    requestForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Product search
  const productSearch = document.getElementById('productSearch2');
  if (productSearch) {
    productSearch.addEventListener('input', (e) => {
      filterProducts(e.target.value);
    });
  }
  
  // Product selection
  const productSelect = document.getElementById('productSelect');
  if (productSelect) {
    productSelect.addEventListener('change', (e) => {
      handleProductSelection(e.target.value);
    });
  }
  
  // Quantity controls
  setupQuantityControls();
  
  // Character counter
  setupCharacterCounter();
  
  // View history button
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', showHistoryModal);
  }
  
  // Refresh data button
  const refreshDataBtn = document.getElementById('refreshDataBtn');
  if (refreshDataBtn) {
    refreshDataBtn.addEventListener('click', () => {
      loadState();
      populateProductSelect();
      renderRecentRequests();
      updateStats();
      showAlert('✓ Data refreshed', ALERTS.SUCCESS, 2000);
    });
  }
  
  // Refresh requests button
  const refreshBtn = document.getElementById('refreshRequests');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderRecentRequests();
      updateStats();
      showAlert('✓ Refreshed successfully', ALERTS.SUCCESS, 2000);
    });
  }
  
  // Success modal buttons
  const modalClose = document.getElementById('modalClose');
  const modalNewRequest = document.getElementById('modalNewRequest');
  
  if (modalClose) {
    modalClose.addEventListener('click', closeSuccessModal);
  }
  
  if (modalNewRequest) {
    modalNewRequest.addEventListener('click', () => {
      closeSuccessModal();
      document.getElementById('requestedByOut').focus();
    });
  }
  
  // History modal buttons
  const closeHistoryBtn = document.getElementById('closeHistoryModal');
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', closeHistoryModal);
  }
  
  // History search
  const historySearch = document.getElementById('historySearch');
  if (historySearch) {
    historySearch.addEventListener('input', (e) => {
      renderHistoryTable(e.target.value);
    });
  }
  
  // Export buttons
  const exportCSVBtn = document.getElementById('exportCSVBtn');
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', exportToCSV);
  }
  
  const exportJSONBtn = document.getElementById('exportJSONBtn');
  if (exportJSONBtn) {
    exportJSONBtn.addEventListener('click', exportToJSON);
  }
  
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', printHistory);
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
  
  // Form reset button
  const resetBtn = requestForm?.querySelector('button[type="reset"]');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      hideProductInfo();
      document.getElementById('charCount').textContent = '0';
    });
  }
  
  // Auto-fill employee name if saved
  if (state.currentEmployeeName) {
    const employeeInput = document.getElementById('requestedByOut');
    if (employeeInput && !employeeInput.value) {
      employeeInput.value = state.currentEmployeeName;
    }
  }
}

// ==================== KEYBOARD SHORTCUTS ====================

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('productSearch2')?.focus();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
      closeSuccessModal();
      closeHistoryModal();
    }
    
    // Ctrl/Cmd + H: Show history
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      showHistoryModal();
    }
    
    // Ctrl/Cmd + Enter: Submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const form = document.getElementById('requestForm');
      if (form && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        form.requestSubmit();
      }
    }
  });
}

// ==================== MOCK DATA GENERATOR ====================

function generateMockData() {
  // Check if products already exist
  if (state.products.length > 0) {
    return;
  }
  
  const mockProducts = [
    { id: 'PROD-001', name: 'Office Paper A4', unit: 'Ream', quantity: 150 },
    { id: 'PROD-002', name: 'Ballpen Blue', unit: 'Box', quantity: 85 },
    { id: 'PROD-003', name: 'Marker Black', unit: 'Piece', quantity: 200 },
    { id: 'PROD-004', name: 'Folder Long', unit: 'Piece', quantity: 120 },
    { id: 'PROD-005', name: 'Stapler Wire', unit: 'Box', quantity: 45 },
    { id: 'PROD-006', name: 'Scissors', unit: 'Piece', quantity: 30 },
    { id: 'PROD-007', name: 'Tape Dispenser', unit: 'Piece', quantity: 50 },
    { id: 'PROD-008', name: 'Highlighter Yellow', unit: 'Piece', quantity: 95 },
    { id: 'PROD-009', name: 'Notebook Spiral', unit: 'Piece', quantity: 110 },
    { id: 'PROD-010', name: 'Envelope Long', unit: 'Box', quantity: 60 },
    { id: 'PROD-011', name: 'Binder Clips Large', unit: 'Box', quantity: 75 },
    { id: 'PROD-012', name: 'Paper Clips', unit: 'Box', quantity: 100 },
    { id: 'PROD-013', name: 'Correction Tape', unit: 'Piece', quantity: 55 },
    { id: 'PROD-014', name: 'Sticky Notes 3x3', unit: 'Pack', quantity: 90 },
    { id: 'PROD-015', name: 'Permanent Marker Red', unit: 'Piece', quantity: 65 },
    { id: 'PROD-016', name: 'Calculator', unit: 'Piece', quantity: 25 },
    { id: 'PROD-017', name: 'Whiteboard Marker', unit: 'Piece', quantity: 80 },
    { id: 'PROD-018', name: 'Paper Puncher', unit: 'Piece', quantity: 35 },
    { id: 'PROD-019', name: 'Rubber Bands', unit: 'Box', quantity: 120 },
    { id: 'PROD-020', name: 'Glue Stick', unit: 'Piece', quantity: 70 }
  ];
  
  state.products = mockProducts;
  saveProducts();
  
  console.log('✓ Mock products generated successfully');
  showAlert('✓ Mock data loaded for testing', ALERTS.INFO, 3000);
}

// ==================== INITIALIZATION ====================

function initializePage() {
  console.log('🟣 Initializing Employee Request Page (Purple & Gold Theme)...');
  
  // Load state from localStorage
  loadState();
  
  // Generate mock data if needed (for testing)
  if (state.products.length === 0) {
    console.log('⚠️ No products found. Generating mock data...');
    generateMockData();
    loadState(); // Reload after generating mock data
  }
  
  // Initialize UI
  populateProductSelect();
  renderRecentRequests();
  updateStats();
  
  // Setup event listeners
  setupEventListeners();
  setupKeyboardShortcuts();
  
  // Initialize feather icons if available
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
  
  console.log('✓ Page initialized successfully');
  console.log(`📦 Products loaded: ${state.products.length}`);
  console.log(`📋 Requests loaded: ${state.requests.length}`);
  
  // Show welcome message
  if (state.currentEmployeeName) {
    setTimeout(() => {
      showAlert(`👋 Welcome back, ${state.currentEmployeeName}!`, ALERTS.INFO, 3000);
    }, 500);
  }
}

// ==================== ERROR HANDLING ====================

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showAlert('An unexpected error occurred. Please refresh the page.', ALERTS.ERROR);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showAlert('An unexpected error occurred. Please try again.', ALERTS.ERROR);
});

// ==================== PAGE VISIBILITY ====================

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Reload data when page becomes visible
    loadState();
    populateProductSelect();
    renderRecentRequests();
    updateStats();
  }
});

// ==================== DOM READY & INITIALIZATION ====================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializePage();
  });
} else {
  // DOM is already loaded
  initializePage();
}

// ==================== CONSOLE WELCOME MESSAGE ====================

console.log('%c🟣✨ LIONG Employee Request System ', 'background: linear-gradient(135deg, #7c3aed, #fbbf24); color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px;');
console.log('%cPurple & Gold Theme Edition', 'color: #7c3aed; font-weight: bold;');
console.log('%cVersion 1.0.0', 'color: #6b7280;');
console.log('');
console.log('💡 Keyboard Shortcuts:');
console.log('   %cCtrl/Cmd + K%c: Focus search', 'background: #f3e8ff; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('   %cCtrl/Cmd + H%c: Show history', 'background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('   %cCtrl/Cmd + Enter%c: Submit form', 'background: #f3e8ff; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('   %cEsc%c: Close modals', 'background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('');
console.log('🎨 Theme Colors: Purple (#7c3aed) & Gold (#fbbf24)');
console.log('');

// ==================== END OF FILE ====================