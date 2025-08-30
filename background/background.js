/**
 * Myl.Zip Authentication - Background Service Worker
 * Handles device authentication and verification for the privately public authentication service
 */

class MylZipAuthService {
  constructor() {
    this.deviceId = null;
    this.isAuthenticated = false;
    this.backendURL = 'https://api.myl.zip';
    this.init();
  }

  async init() {
    console.log('Myl.Zip Authentication Service: Initializing...');
    
    try {
      // Load device ID or generate new one
      await this.loadDeviceId();
      
      // Setup message listeners
      this.setupMessageListeners();
      
      // Check authentication status
      await this.checkAuthenticationStatus();
      
      console.log('Myl.Zip Authentication Service: Ready');
    } catch (error) {
      console.error('Error initializing Myl.Zip authentication service:', error);
    }
  }

  async loadDeviceId() {
    try {
      const result = await chrome.storage.local.get(['mylZipDeviceId']);
      if (result.mylZipDeviceId) {
        this.deviceId = result.mylZipDeviceId;
        console.log('Loaded existing device ID:', this.deviceId);
      } else {
        this.deviceId = this.generateDeviceId();
        await chrome.storage.local.set({ mylZipDeviceId: this.deviceId });
        console.log('Generated new device ID for authentication:', this.deviceId);
      }
    } catch (error) {
      console.error('Error loading device ID:', error);
      this.deviceId = this.generateDeviceId();
    }
  }

  generateDeviceId() {
    // Generate a secure device identifier for authentication
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `mylzip_auth_${timestamp}_${random}`;
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('Myl.Zip Authentication Service: Received message:', message.type);
      
      switch (message.type) {
        case 'GET_DEVICE_INFO':
          sendResponse({ 
            deviceId: this.deviceId, 
            isAuthenticated: this.isAuthenticated 
          });
          break;

        case 'CHECK_AUTHENTICATION':
          const authStatus = await this.checkAuthenticationStatus();
          sendResponse({ isAuthenticated: authStatus });
          break;

        case 'OPEN_MYLZIP_PORTAL':
          await this.openMylZipPortal();
          sendResponse({ success: true });
          break;

        case 'GET_AUTHENTICATION_URL':
          const authUrl = this.getAuthenticationUrl();
          sendResponse({ authUrl });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Myl.Zip Authentication Service: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async checkAuthenticationStatus() {
    try {
      const response = await fetch(`${this.backendURL}/api/v1/device/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId: this.deviceId })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isAuthenticated = data.authenticated;
        return this.isAuthenticated;
      } else {
        this.isAuthenticated = false;
        return false;
      }
    } catch (error) {
      console.warn('Authentication status check failed:', error.message);
      this.isAuthenticated = false;
      return false;
    }
  }

  async openMylZipPortal() {
    try {
      // Open the Myl.Zip portal for device authentication
      await chrome.tabs.create({ 
        url: 'https://myl.zip/auth?deviceId=' + this.deviceId 
      });
    } catch (error) {
      console.error('Error opening Myl.Zip authentication portal:', error);
    }
  }

  getAuthenticationUrl() {
    return `https://myl.zip/auth?deviceId=${this.deviceId}&source=extension`;
  }
}

// Initialize the Myl.Zip authentication service
const mylZipAuthService = new MylZipAuthService();

