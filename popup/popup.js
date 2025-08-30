/**
 * Myl.Zip Authentication - Popup Manager
 * Handles the popup interface for device authentication service
 */

class MylZipAuthPopup {
  constructor() {
    this.deviceId = null;
    this.isAuthenticated = false;
    this.init();
  }

  async init() {
    console.log('Myl.Zip Authentication Popup: Initializing...');
    
    try {
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      // Update UI
      this.updateUI();
      
      console.log('Myl.Zip Authentication Popup: Ready');
    } catch (error) {
      console.error('Error initializing authentication popup:', error);
      this.showError('Failed to initialize authentication service');
    }
  }

  setupEventListeners() {
    // Verify device button
    document.getElementById('setupBtn').addEventListener('click', () => {
      this.verifyDevice();
    });

    // Access portal button
    document.getElementById('portalBtn').addEventListener('click', () => {
      this.accessPortal();
    });

    // Refresh status button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.refreshAuthenticationStatus();
    });
  }

  async loadInitialData() {
    try {
      // Get device information from background script
      const deviceInfo = await this.sendMessage('GET_DEVICE_INFO');
      this.deviceId = deviceInfo.deviceId;
      this.isAuthenticated = deviceInfo.isAuthenticated;
      
      // Check authentication status
      await this.checkAuthenticationStatus();
      
    } catch (error) {
      console.error('Error loading authentication data:', error);
      this.showError('Failed to load device authentication information');
    }
  }

  async checkAuthenticationStatus() {
    try {
      const response = await this.sendMessage('CHECK_AUTHENTICATION');
      this.isAuthenticated = response.isAuthenticated;
      this.updateUI();
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.isAuthenticated = false;
      this.updateUI();
    }
  }

  updateUI() {
    // Update device ID display
    const deviceIdElement = document.getElementById('deviceId');
    if (deviceIdElement) {
      deviceIdElement.textContent = this.deviceId || 'Not available';
    }

    // Update authentication status
    const authStatusElement = document.getElementById('authStatus');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (this.isAuthenticated) {
      authStatusElement.textContent = 'Verified';
      authStatusElement.className = 'info-value status-active';
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Authenticated';
    } else {
      authStatusElement.textContent = 'Not verified';
      authStatusElement.className = 'info-value status-inactive';
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Not authenticated';
    }

    // Update button states
    this.updateButtonStates();
  }

  updateButtonStates() {
    const setupBtn = document.getElementById('setupBtn');
    const portalBtn = document.getElementById('portalBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    if (this.isAuthenticated) {
      setupBtn.textContent = '🔐 Re-verify Device';
      portalBtn.disabled = false;
    } else {
      setupBtn.textContent = '🔐 Verify Device';
      portalBtn.disabled = true;
    }

    // Enable refresh button
    refreshBtn.disabled = false;
  }

  async verifyDevice() {
    try {
      // Get authentication URL from background script
      const response = await this.sendMessage('GET_AUTHENTICATION_URL');
      const authUrl = response.authUrl;
      
      // Open the authentication portal
      await chrome.tabs.create({ url: authUrl });
      
      // Close popup
      window.close();
    } catch (error) {
      console.error('Error opening authentication portal:', error);
      this.showError('Failed to open authentication portal');
    }
  }

  async accessPortal() {
    try {
      // Open the main Myl.Zip portal
      await chrome.tabs.create({ url: 'https://myl.zip' });
      
      // Close popup
      window.close();
    } catch (error) {
      console.error('Error accessing Myl.Zip portal:', error);
      this.showError('Failed to access portal');
    }
  }

  async refreshAuthenticationStatus() {
    try {
      // Show loading state
      const refreshBtn = document.getElementById('refreshBtn');
      const originalText = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<span class="btn-icon">⏳</span> Verifying...';
      refreshBtn.disabled = true;

      // Check authentication status
      await this.checkAuthenticationStatus();
      
      // Restore button
      refreshBtn.innerHTML = originalText;
      refreshBtn.disabled = false;
      
      this.showSuccess('Authentication status refreshed');
    } catch (error) {
      console.error('Error refreshing authentication status:', error);
      this.showError('Failed to refresh authentication status');
      
      // Restore button on error
      const refreshBtn = document.getElementById('refreshBtn');
      refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> Refresh Status';
      refreshBtn.disabled = false;
    }
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  showSuccess(message) {
    // Simple success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showError(message) {
    // Simple error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize the authentication popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MylZipAuthPopup();
});
