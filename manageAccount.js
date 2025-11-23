// ========================================
// MANAGE ACCOUNT - JAVASCRIPT
// PURPLE & GOLD THEME
// ========================================

// ==================== CONSTANTS & CONFIG ====================
const STORAGE_KEYS = {
  PRODUCTS: 'products',
  REQUESTS: 'productRequests',
  EMPLOYEE_NAME: 'employeeName',
  EMPLOYEE_DATA: 'employeeData',
  PREFERENCES: 'employeePreferences',
  ACTIVITY_LOG: 'employeeActivityLog'
};

const ALERTS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// ==================== STATE MANAGEMENT ====================
let state = {
  currentUser: {
    employeeId: 'EMP-001',
    name: 'Employee User',
    position: 'Staff Member',
    department: 'General Department',
    email: 'employee@company.com',
    phone: '+1 (555) 123-4567',
    dateJoined: new Date(2024, 0, 15).toISOString(),
    lastLogin: new Date().toISOString(),
    avatar: null
  },
  requests: [],
  preferences: {
    emailNotifications: true,
    pushNotifications: false,
    requestUpdates: true,
    darkMode: false,
    compactView: false,
    itemsPerPage: 10,
    saveHistory: true,
    autoSave: true
  },
  activityLog: [],
  stats: {
    total: 0,
    approved: 0,
    pending: 0,
    denied: 0,
    thisMonth: 0,
    successRate: 0
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
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
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
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
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

// Generate avatar URL
function generateAvatarUrl(name, size = 150) {
  const encodedName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${encodedName}&background=7c3aed&color=fff&size=${size}`;
}

// ==================== STORAGE FUNCTIONS ====================

function loadFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
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
  // Load employee data
  const savedEmployee = loadFromStorage(STORAGE_KEYS.EMPLOYEE_DATA);
  if (savedEmployee) {
    state.currentUser = { ...state.currentUser, ...savedEmployee };
  }
  
  // Load employee name from storage (for compatibility)
  const savedName = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_NAME);
  if (savedName) {
    state.currentUser.name = savedName;
  }
  
  // Load requests
  state.requests = loadFromStorage(STORAGE_KEYS.REQUESTS, []);
  
  // Load preferences
  const savedPreferences = loadFromStorage(STORAGE_KEYS.PREFERENCES);
  if (savedPreferences) {
    state.preferences = { ...state.preferences, ...savedPreferences };
  }
  
  // Load activity log
  state.activityLog = loadFromStorage(STORAGE_KEYS.ACTIVITY_LOG, []);
}

function saveEmployeeData() {
  saveToStorage(STORAGE_KEYS.EMPLOYEE_DATA, state.currentUser);
  localStorage.setItem(STORAGE_KEYS.EMPLOYEE_NAME, state.currentUser.name);
}

function savePreferences() {
  saveToStorage(STORAGE_KEYS.PREFERENCES, state.preferences);
}

function saveActivityLog() {
  saveToStorage(STORAGE_KEYS.ACTIVITY_LOG, state.activityLog);
}

// ==================== ALERT SYSTEM ====================

function showAlert(message, type = ALERTS.INFO, duration = 5000) {
  const container = document.getElementById('alertContainer');
  if (!container) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  
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

// ==================== TAB NAVIGATION ====================

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      button.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
        
        // Log activity
        logActivity('navigation', `Viewed ${targetTab} tab`);
      }
    });
  });
}

// ==================== PROFILE MANAGEMENT ====================

function populateProfileData() {
  const user = state.currentUser;
  
  // Update avatar
  const avatarElement = document.getElementById('profileAvatar');
  if (avatarElement) {
    avatarElement.src = user.avatar || generateAvatarUrl(user.name);
  }
  
  // Update display name and position
  const displayName = document.getElementById('profileDisplayName');
  const displayPosition = document.getElementById('profileDisplayPosition');
  if (displayName) displayName.textContent = user.name;
  if (displayPosition) displayPosition.textContent = user.position;
  
  // Populate form fields
  document.getElementById('employeeName').value = user.name;
  document.getElementById('employeeId').value = user.employeeId;
  document.getElementById('position').value = user.position;
  document.getElementById('department').value = user.department;
  document.getElementById('email').value = user.email || '';
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('dateJoined').value = formatDate(user.dateJoined);
  
  // Update member since and last login
  const memberSince = document.getElementById('memberSince');
  const lastLogin = document.getElementById('lastLogin');
  if (memberSince) memberSince.textContent = formatDate(user.dateJoined);
  if (lastLogin) lastLogin.textContent = formatTimeAgo(user.lastLogin);
}

function handleProfileSubmit(e) {
  e.preventDefault();
  
  showLoading();
  
  // Get form values
  const name = document.getElementById('employeeName').value.trim();
  const position = document.getElementById('position').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  
  // Validate
  if (!name || name.length < 2) {
    hideLoading();
    showAlert('Name must be at least 2 characters long', ALERTS.ERROR);
    return;
  }
  
  if (!position) {
    hideLoading();
    showAlert('Position is required', ALERTS.ERROR);
    return;
  }
  
  if (email && !validateEmail(email)) {
    hideLoading();
    showAlert('Please enter a valid email address', ALERTS.ERROR);
    return;
  }
  
  // Simulate API delay
  setTimeout(() => {
    // Update state
    state.currentUser.name = name;
    state.currentUser.position = position;
    state.currentUser.email = email;
    state.currentUser.phone = phone;
    
    // Save to storage
    saveEmployeeData();
    
    // Update display
    populateProfileData();
    
    // Log activity
    logActivity('profile', 'Updated profile information');
    
    hideLoading();
    showSuccessModal('Profile Updated', 'Your profile information has been updated successfully.');
    showAlert('✓ Profile updated successfully', ALERTS.SUCCESS);
  }, 800);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function handleAvatarUpload() {
  const input = document.getElementById('avatarInput');
  const file = input.files[0];
  
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showAlert('Please select an image file', ALERTS.ERROR);
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showAlert('Image size must be less than 5MB', ALERTS.ERROR);
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const avatarUrl = e.target.result;
    
    // Update avatar
    state.currentUser.avatar = avatarUrl;
    saveEmployeeData();
    
    // Update display
    const avatarElement = document.getElementById('profileAvatar');
    if (avatarElement) {
      avatarElement.src = avatarUrl;
    }
    
    // Log activity
    logActivity('profile', 'Updated profile picture');
    
    showAlert('✓ Profile picture updated', ALERTS.SUCCESS);
  };
  
  reader.readAsDataURL(file);
}

// ==================== PASSWORD MANAGEMENT ====================

function setupPasswordValidation() {
  const newPasswordInput = document.getElementById('newPassword');
  
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      updatePasswordStrength(password);
      validatePasswordRequirements(password);
    });
  }
}

function validatePasswordRequirements(password) {
  const requirements = {
    'req-length': password.length >= 8,
    'req-uppercase': /[A-Z]/.test(password),
    'req-lowercase': /[a-z]/.test(password),
    'req-number': /[0-9]/.test(password),
    'req-special': /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  Object.entries(requirements).forEach(([id, isValid]) => {
    const element = document.getElementById(id);
    if (element) {
      if (isValid) {
        element.classList.add('valid');
      } else {
        element.classList.remove('valid');
      }
    }
  });
  
  return Object.values(requirements).every(v => v);
}

function updatePasswordStrength(password) {
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');
  
  if (!strengthFill || !strengthText) return;
  
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  let strengthClass = '';
  let strengthLabel = '';
  
  if (strength <= 2) {
    strengthClass = 'weak';
    strengthLabel = 'Weak Password';
  } else if (strength <= 4) {
    strengthClass = 'medium';
    strengthLabel = 'Medium Password';
  } else {
    strengthClass = 'strong';
    strengthLabel = 'Strong Password';
  }
  
  strengthFill.className = `strength-fill ${strengthClass}`;
  strengthText.className = `strength-text ${strengthClass}`;
  strengthText.textContent = strengthLabel;
}

function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = button.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}

function handlePasswordSubmit(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validate current password (in real app, verify with backend)
  if (!currentPassword) {
    showAlert('Please enter your current password', ALERTS.ERROR);
    return;
  }
  
  // Validate new password
  if (!validatePasswordRequirements(newPassword)) {
    showAlert('Password does not meet all requirements', ALERTS.ERROR);
    return;
  }
  
  // Check if passwords match
  if (newPassword !== confirmPassword) {
    showAlert('Passwords do not match', ALERTS.ERROR);
    return;
  }
  
  // Check if new password is same as current
  if (currentPassword === newPassword) {
    showAlert('New password must be different from current password', ALERTS.WARNING);
    return;
  }
  
  showLoading();
  
  // Simulate API delay
  setTimeout(() => {
    // In real app, send to backend
    
    // Reset form
    document.getElementById('passwordForm').reset();
    
    // Reset strength indicator
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    if (strengthFill) strengthFill.className = 'strength-fill';
    if (strengthText) {
      strengthText.className = 'strength-text';
      strengthText.textContent = '';
    }
    
    // Reset requirements
    ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.classList.remove('valid');
    });
    
    // Log activity
    logActivity('security', 'Changed account password');
    
    hideLoading();
    showSuccessModal('Password Updated', 'Your password has been changed successfully. Please use your new password for future logins.');
    showAlert('✓ Password updated successfully', ALERTS.SUCCESS);
  }, 1000);
}

// ==================== PREFERENCES MANAGEMENT ====================

function populatePreferences() {
  const prefs = state.preferences;
  
  document.getElementById('emailNotifications').checked = prefs.emailNotifications;
  document.getElementById('pushNotifications').checked = prefs.pushNotifications;
  document.getElementById('requestUpdates').checked = prefs.requestUpdates;
  document.getElementById('darkMode').checked = prefs.darkMode;
  document.getElementById('compactView').checked = prefs.compactView;
  document.getElementById('itemsPerPage').value = prefs.itemsPerPage;
  document.getElementById('saveHistory').checked = prefs.saveHistory;
  document.getElementById('autoSave').checked = prefs.autoSave;
}

function handlePreferencesSubmit(e) {
  e.preventDefault();
  
  showLoading();
  
  // Get form values
  state.preferences = {
    emailNotifications: document.getElementById('emailNotifications').checked,
    pushNotifications: document.getElementById('pushNotifications').checked,
    requestUpdates: document.getElementById('requestUpdates').checked,
    darkMode: document.getElementById('darkMode').checked,
    compactView: document.getElementById('compactView').checked,
    itemsPerPage: parseInt(document.getElementById('itemsPerPage').value),
    saveHistory: document.getElementById('saveHistory').checked,
    autoSave: document.getElementById('autoSave').checked
  };
  
  // Simulate API delay
  setTimeout(() => {
    // Save preferences
    savePreferences();
    
    // Apply dark mode if enabled
    if (state.preferences.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Log activity
    logActivity('settings', 'Updated application preferences');
    
    hideLoading();
    showSuccessModal('Preferences Saved', 'Your preferences have been saved successfully.');
    showAlert('✓ Preferences saved successfully', ALERTS.SUCCESS);
  }, 800);
}

function resetPreferences() {
  if (!confirm('Are you sure you want to reset all preferences to default?')) {
    return;
  }
  
  state.preferences = {
    emailNotifications: true,
    pushNotifications: false,
    requestUpdates: true,
    darkMode: false,
    compactView: false,
    itemsPerPage: 10,
    saveHistory: true,
    autoSave: true
  };
  
  populatePreferences();
  savePreferences();
  
  showAlert('✓ Preferences reset to default', ALERTS.INFO);
  logActivity('settings', 'Reset preferences to default');
}

// ==================== STATISTICS ====================

function calculateStats() {
  const requests = state.requests;
  
  state.stats.total = requests.length;
  state.stats.approved = requests.filter(r => r.status === 'Approved_Dep' || r.status === 'Forwarded_Inv').length;
  state.stats.pending = requests.filter(r => r.status === 'Pending').length;
  state.stats.denied = requests.filter(r => r.status === 'Denied').length;
  
  // Calculate this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  state.stats.thisMonth = requests.filter(r => {
    const date = new Date(r.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  
  // Calculate success rate
  if (state.stats.total > 0) {
    state.stats.successRate = Math.round((state.stats.approved / state.stats.total) * 100);
  } else {
    state.stats.successRate = 0;
  }
  
  updateStatsDisplay();
}

function updateStatsDisplay() {
  const stats = state.stats;
  
  document.getElementById('statTotalRequests').textContent = stats.total;
  document.getElementById('statApproved').textContent = stats.approved;
  document.getElementById('statPending').textContent = stats.pending;
  document.getElementById('statDenied').textContent = stats.denied;
  document.getElementById('statThisMonth').textContent = stats.thisMonth;
  document.getElementById('statSuccessRate').textContent = `${stats.successRate}%`;
}

// ==================== ACTIVITY LOG ====================

function logActivity(type, description) {
  const activity = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    type: type,
    description: description,
    timestamp: new Date().toISOString(),
    icon: getActivityIcon(type)
  };
  
  state.activityLog.unshift(activity);
  
  // Keep only last 100 activities
  if (state.activityLog.length > 100) {
    state.activityLog = state.activityLog.slice(0, 100);
  }
  
  saveActivityLog();
}

function getActivityIcon(type) {
  const iconMap = {
    'profile': 'icon-info',
    'security': 'icon-warning',
    'settings': 'icon-info',
    'request': 'icon-success',
    'navigation': 'icon-info'
  };
  
  return iconMap[type] || 'icon-info';
}

function renderActivityLog(filter = '') {
  const timeline = document.getElementById('activityTimeline');
  if (!timeline) return;
  
  let activities = [...state.activityLog];
  
  // Apply filter
  if (filter) {
    activities = activities.filter(a => a.type === filter);
  }
  
  // Limit to 20 for initial display
  const displayActivities = activities.slice(0, 20);
  
  if (displayActivities.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-history"></i>
        <p>No activity to display</p>
      </div>
    `;
    return;
  }
  
  timeline.innerHTML = displayActivities.map((activity, index) => `
    <div class="timeline-item" style="animation-delay: ${index * 0.05}s">
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-title">
            <span class="timeline-icon ${activity.icon}">
              <i class="${getActivityIconClass(activity.type)}"></i>
            </span>
            ${escapeHtml(activity.description)}
          </span>
          <span class="timeline-time">
            <i class="fas fa-clock"></i>
            ${formatTimeAgo(activity.timestamp)}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

function getActivityIconClass(type) {
  const iconMap = {
    'profile': 'fas fa-user-edit',
    'security': 'fas fa-shield-alt',
    'settings': 'fas fa-cog',
    'request': 'fas fa-paper-plane',
    'navigation': 'fas fa-eye'
  };
  
  return iconMap[type] || 'fas fa-info-circle';
}

function generateMockActivityLog() {
  if (state.activityLog.length > 0) return;
  
  const mockActivities = [
    { type: 'profile', description: 'Updated profile information' },
    { type: 'navigation', description: 'Viewed dashboard tab' },
    { type: 'request', description: 'Submitted new request #REQ-1234' },
    { type: 'settings', description: 'Changed notification preferences' },
    { type: 'navigation', description: 'Viewed security tab' },
    { type: 'profile', description: 'Updated profile picture' },
    { type: 'navigation', description: 'Viewed activity log' },
    { type: 'security', description: 'Changed account password' },
    { type: 'request', description: 'Viewed request details' },
    { type: 'settings', description: 'Updated display preferences' }
  ];
  
  mockActivities.forEach((activity, index) => {
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - index * 2);
    
    state.activityLog.push({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      type: activity.type,
      description: activity.description,
      timestamp: timestamp.toISOString(),
      icon: getActivityIcon(activity.type)
    });
  });
  
  saveActivityLog();
}

// ==================== MODAL FUNCTIONS ====================

function showSuccessModal(title, message) {
  const modal = document.getElementById('successModal');
  const titleElement = document.getElementById('successTitle');
  const messageElement = document.getElementById('successMessage');
  
  if (titleElement) titleElement.textContent = title;
  if (messageElement) messageElement.textContent = message;
  
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const titleElement = document.getElementById('confirmTitle');
  const messageElement = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('proceedConfirm');
  
  if (titleElement) titleElement.textContent = title;
  if (messageElement) messageElement.textContent = message;
  
  // Remove old event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  // Add new event listener
  newConfirmBtn.addEventListener('click', () => {
    closeModal('confirmModal');
    if (onConfirm) onConfirm();
  });
  
  if (modal) {
    modal.classList.add('show');
  }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Back to dashboard
  const backBtn = document.getElementById('backToDashboard');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'employeeDashboard.html';
    });
  }
  
  // Profile form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }
  
  // Cancel profile edit
  const cancelProfileBtn = document.getElementById('cancelProfileEdit');
  if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', () => {
      populateProfileData();
      showAlert('Changes discarded', ALERTS.INFO, 2000);
    });
  }
  
  // Avatar upload
  const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
  const avatarInput = document.getElementById('avatarInput');
  
  if (uploadAvatarBtn && avatarInput) {
    uploadAvatarBtn.addEventListener('click', () => {
      avatarInput.click();
    });
    
    avatarInput.addEventListener('change', handleAvatarUpload);
  }
  
  // Password form
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordSubmit);
  }
  
  // Preferences form
  const preferencesForm = document.getElementById('preferencesForm');
  if (preferencesForm) {
    preferencesForm.addEventListener('submit', handlePreferencesSubmit);
  }
  
  // Reset preferences
  const resetPreferencesBtn = document.getElementById('resetPreferences');
  if (resetPreferencesBtn) {
    resetPreferencesBtn.addEventListener('click', resetPreferences);
  }
  
  // Activity filter
  const activityFilter = document.getElementById('activityFilter');
  if (activityFilter) {
    activityFilter.addEventListener('change', (e) => {
      renderActivityLog(e.target.value);
    });
  }
  
  // Refresh activity
  const refreshActivityBtn = document.getElementById('refreshActivity');
  if (refreshActivityBtn) {
    refreshActivityBtn.addEventListener('click', () => {
      renderActivityLog();
      showAlert('✓ Activity log refreshed', ALERTS.SUCCESS, 2000);
    });
  }
  
  // Load more activity
  const loadMoreBtn = document.getElementById('loadMoreActivity');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      showAlert('Load more feature coming soon', ALERTS.INFO);
    });
  }
  
  // Success modal close
  const closeSuccessBtn = document.getElementById('closeSuccessModal');
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => closeModal('successModal'));
  }
  
  // Confirm modal buttons
  const cancelConfirmBtn = document.getElementById('cancelConfirm');
  if (cancelConfirmBtn) {
    cancelConfirmBtn.addEventListener('click', () => closeModal('confirmModal'));
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

function initializeAccount() {
  console.log('🟣✨ Initializing Manage Account Page (Purple & Gold Theme)...');
  
  // Load state from storage
  loadState();
  
  // Setup tabs
  setupTabs();
  
  // Populate profile data
  populateProfileData();
  
  // Setup password validation
  setupPasswordValidation();
  setupPasswordToggles();
  
  // Populate preferences
  populatePreferences();
  
  // Calculate and display stats
  calculateStats();
  
  // Generate mock activity if empty
  generateMockActivityLog();
  
  // Render activity log
  renderActivityLog();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize feather icons if available
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
  
  // Log initial activity
  logActivity('navigation', 'Visited account management page');
  
  console.log('✓ Account page initialized successfully');
  console.log(`👤 User: ${state.currentUser.name}`);
  console.log(`📊 Total Requests: ${state.stats.total}`);
  console.log(`📝 Activity Log: ${state.activityLog.length} entries`);
  
  // Welcome message
  setTimeout(() => {
    showAlert(`Welcome, ${state.currentUser.name}!`, ALERTS.INFO, 3000);
  }, 500);
}

// ==================== KEYBOARD SHORTCUTS ====================

document.addEventListener('keydown', (e) => {
  // Escape: Close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      modal.classList.remove('show');
    });
  }
  
  // Ctrl/Cmd + S: Save current form
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    const form = activeTab.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  }
});

// ==================== PAGE VISIBILITY ====================

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadState();
    populateProfileData();
    calculateStats();
    renderActivityLog();
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
  document.addEventListener('DOMContentLoaded', initializeAccount);
} else {
  initializeAccount();
}

// ==================== CONSOLE WELCOME MESSAGE ====================

console.log('%c🟣✨ LIONG Manage Account ', 'background: linear-gradient(135deg, #7c3aed, #fbbf24); color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;');
console.log('%cPurple & Gold Theme Edition', 'color: #7c3aed; font-weight: bold; font-size: 14px;');
console.log('%cVersion 1.0.0', 'color: #6b7280; font-size: 12px;');
console.log('');
console.log('💡 %cKeyboard Shortcuts:', 'font-weight: bold;');
console.log('   %cCtrl/Cmd + S%c: Save current form', 'background: #f3e8ff; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('   %cEsc%c: Close modals', 'background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: bold;', '');
console.log('');
console.log('🎨 Theme Colors: Purple (#7c3aed) & Gold (#fbbf24)');
console.log('👤 Account Management loaded successfully!');
console.log('');

// ==================== END OF FILE ====================