/**
 * Zip Myl Chromium - Simplified Background Service Worker
 * Core functionality for SSL certificate provisioning and tracking
 */

class SimpleBackgroundService {
  constructor() {
    this.settings = null;
    this.apiClient = null;
    this.backendURL = 'https://api.myl.zip';
    this.connectionStatus = { status: 'unknown', timestamp: null };
    this.init();
  }

  async init() {
    console.log('Zip Myl Chromium Background: Initializing...');
    
    try {
      // Load settings
      await this.loadSettings();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Test backend connection
      await this.testBackendConnection();
      
      console.log('Zip Myl Chromium Background: Ready');
    } catch (error) {
      console.error('Error initializing background service:', error);
      // Ensure we have default settings even if loading fails
      if (!this.settings) {
        this.settings = this.getDefaultSettings();
        console.log('Using default settings due to initialization error');
      }
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['zipMylSettings']);
      this.settings = { ...this.getDefaultSettings(), ...result.zipMylSettings };
      console.log('Settings loaded:', this.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ zipMylSettings: this.settings });
      console.log('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  getDefaultSettings() {
    return {
      // SSL Settings
      enableSSLProvisioning: true,
      enableTierDetection: true,
      enableWindowsIntegration: true,
      
      // Tracking Settings
      enableTracking: true,
      enableAnalytics: true,
      
      // Backend Settings
      backendURL: 'https://api.myl.zip',
      enableBackendSync: true,
      
      // UI Settings
      enableNotifications: true,
      enableStatusIndicators: true
    };
  }

  setupEventListeners() {
    // Message handling
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async responses
      });
    }

    // Storage changes
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        this.handleStorageChange(changes, namespace);
      });
    }

    // Tab events (if available)
    if (chrome.tabs) {
      if (chrome.tabs.onActivated) {
        chrome.tabs.onActivated.addListener((activeInfo) => {
          this.handleTabActivated(activeInfo);
        });
      }

      if (chrome.tabs.onUpdated) {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
          this.handleTabUpdated(tabId, changeInfo, tab);
        });
      }
    }
  }

  async testBackendConnection() {
    try {
      const response = await fetch(`${this.backendURL}/api/v1/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        this.connectionStatus = { 
          status: 'connected', 
          timestamp: new Date().toISOString() 
        };
        console.log('Backend connection established');
        return true;
      } else {
        this.connectionStatus = { 
          status: 'error', 
          timestamp: new Date().toISOString() 
        };
        console.warn('Backend connection failed - HTTP', response.status);
        return false;
      }
    } catch (error) {
      this.connectionStatus = { 
        status: 'error', 
        timestamp: new Date().toISOString() 
      };
      console.warn('Backend connection test failed:', error.message);
      return false;
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('Background: Received message:', message.type, 'from:', sender);
      
      switch (message.type) {
        case 'GET_SETTINGS':
          sendResponse({ settings: this.settings });
          break;

        case 'UPDATE_SETTINGS':
          this.settings = { ...this.settings, ...message.settings };
          await this.saveSettings();
          sendResponse({ success: true });
          break;

        case 'GET_SSL_STATUS':
          const sslStatus = await this.getSSLStatus(message.deviceId);
          sendResponse({ success: true, data: sslStatus });
          break;

        case 'PROVISION_SSL':
          const provisionResult = await this.provisionSSL(message.deviceId, message.domain, message.certificateType);
          sendResponse({ success: true, data: provisionResult });
          break;

        case 'UPGRADE_TO_ENTERPRISE':
          const upgradeResult = await this.upgradeToEnterprise(message.deviceId);
          sendResponse({ success: true, data: upgradeResult });
          break;

        case 'GET_TIER_BENEFITS':
          const tierBenefits = this.getTierBenefits();
          sendResponse({ success: true, data: tierBenefits });
          break;

        case 'GET_TRACKING_SUMMARY':
          const trackingSummary = await this.getTrackingSummary(message.deviceId);
          sendResponse({ success: true, data: trackingSummary });
          break;

        case 'BACKEND_HEALTH_CHECK':
          const isHealthy = await this.testBackendConnection();
          sendResponse({ success: true, isHealthy: isHealthy });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleStorageChange(changes, namespace) {
    console.log('Storage changed:', namespace, changes);
    
    // Reload settings if they changed
    if (namespace === 'local' && changes.zipMylSettings) {
      await this.loadSettings();
    }
  }

  async handleTabActivated(activeInfo) {
    console.log('Tab activated:', activeInfo.tabId);
  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      console.log('Tab updated:', tabId, tab.url);
    }
  }

  async getSSLStatus(deviceId) {
    // Mock SSL status for testing
    return {
      hasCertificate: true,
      certificateType: 'basic',
      userTier: 'free',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenewal: true,
      windowsInstalled: false,
      needsUpgrade: true
    };
  }

  async provisionSSL(deviceId, domain, certificateType = 'basic') {
    // Mock SSL provisioning for testing
    console.log('Provisioning SSL certificate:', { deviceId, domain, certificateType });
    
    return {
      success: true,
      certificateId: `cert_${Date.now()}`,
      certificateType: certificateType,
      domain: domain,
      provisionedAt: new Date().toISOString()
    };
  }

  async upgradeToEnterprise(deviceId) {
    // Mock enterprise upgrade for testing
    console.log('Upgrading to enterprise:', deviceId);
    
    return {
      success: true,
      newTier: 'enterprise',
      upgradedAt: new Date().toISOString(),
      price: '$19/month'
    };
  }

  getTierBenefits() {
    return {
      free: {
        name: 'Friends & Family',
        price: 'FREE',
        features: [
          'Basic SSL Certificate',
          'Standard Security',
          'Community Support',
          'Basic Analytics'
        ]
      },
      enterprise: {
        name: 'Enterprise',
        price: '$19/month',
        features: [
          'Advanced SSL Certificate',
          'Windows 11 Auto-Install',
          'Priority Support',
          'Business Analytics',
          'Team Management',
          'Advanced Security'
        ]
      }
    };
  }

  async getTrackingSummary(deviceId) {
    // Mock tracking summary for testing
    return {
      sessionId: `session_${Date.now()}`,
      pageViews: 42,
      formSubmissions: 8,
      userInteractions: 156,
      uptime: Date.now() - (60 * 60 * 1000)
    };
  }
}

// Initialize the background service
const backgroundService = new SimpleBackgroundService();

// Export for testing
if (typeof window !== 'undefined') {
  window.SimpleBackgroundService = SimpleBackgroundService;
}
