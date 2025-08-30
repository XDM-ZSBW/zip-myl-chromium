/**
 * Myl.Zip Client - Content Script
 * Handles integration with the Myl.Zip portal
 */

class MylZipContentScript {
  constructor() {
    this.isActive = false;
    this.deviceId = null;
    this.init();
  }

  async init() {
    console.log('Myl.Zip Client Content Script: Initializing...');
    
    try {
      // Check if we're on a Myl.Zip domain
      if (this.isMylZipDomain()) {
        this.isActive = true;
        
        // Get device ID from background script
        await this.loadDeviceId();
        
        // Setup portal integration
        this.setupPortalIntegration();
        
        console.log('Myl.Zip Client Content Script: Active on Myl.Zip portal');
      } else {
        console.log('Myl.Zip Client Content Script: Not active (not on Myl.Zip domain)');
      }
    } catch (error) {
      console.error('Error initializing content script:', error);
    }
  }

  isMylZipDomain() {
    const hostname = window.location.hostname;
    return hostname === 'myl.zip' || hostname.endsWith('.myl.zip');
  }

  async loadDeviceId() {
    try {
      const response = await this.sendMessage('GET_DEVICE_INFO');
      this.deviceId = response.deviceId;
    } catch (error) {
      console.error('Error loading device ID:', error);
    }
  }

  setupPortalIntegration() {
    // Add device ID to page for portal integration
    this.addDeviceIdToPage();
    
    // Setup message listeners
    this.setupMessageListeners();
    
    // Add visual indicator
    this.addVisualIndicator();
  }

  addDeviceIdToPage() {
    if (this.deviceId) {
      // Add device ID as a data attribute to the body
      document.body.setAttribute('data-mylzip-device-id', this.deviceId);
      
      // Add device ID to window object for portal access
      window.mylZipDeviceId = this.deviceId;
      
      // Dispatch custom event for portal integration
      const event = new CustomEvent('mylzip-device-ready', {
        detail: { deviceId: this.deviceId }
      });
      document.dispatchEvent(event);
    }
  }

  setupMessageListeners() {
    // Listen for messages from the portal
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://myl.zip' && !event.origin.endsWith('.myl.zip')) {
        return; // Only accept messages from Myl.Zip domains
      }
      
      this.handlePortalMessage(event.data);
    });
  }

  handlePortalMessage(message) {
    if (message.type === 'mylzip-portal-request') {
      switch (message.action) {
        case 'get-device-info':
          this.sendDeviceInfoToPortal();
          break;
        case 'authenticate-device':
          this.handleDeviceAuthentication(message.data);
          break;
        case 'setup-complete':
          this.handleSetupComplete(message.data);
          break;
      }
    }
  }

  sendDeviceInfoToPortal() {
    const deviceInfo = {
      deviceId: this.deviceId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
    
    window.postMessage({
      type: 'mylzip-extension-response',
      action: 'device-info',
      data: deviceInfo
    }, '*');
  }

  async handleDeviceAuthentication(authData) {
    try {
      // Send authentication request to background script
      const response = await this.sendMessage('CHECK_AUTHENTICATION');
      
      // Send response back to portal
      window.postMessage({
        type: 'mylzip-extension-response',
        action: 'authentication-result',
        data: { isAuthenticated: response.isAuthenticated }
      }, '*');
    } catch (error) {
      console.error('Error handling device authentication:', error);
    }
  }

  async handleSetupComplete(setupData) {
    try {
      // Notify background script of setup completion
      await this.sendMessage('CHECK_AUTHENTICATION');
      
      // Send confirmation to portal
      window.postMessage({
        type: 'mylzip-extension-response',
        action: 'setup-complete',
        data: { success: true }
      }, '*');
    } catch (error) {
      console.error('Error handling setup completion:', error);
    }
  }

  addVisualIndicator() {
    // Add a subtle visual indicator that the extension is active
    const indicator = document.createElement('div');
    indicator.id = 'mylzip-extension-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      background: #4CAF50;
      border-radius: 50%;
      z-index: 10000;
      opacity: 0.7;
      pointer-events: none;
    `;
    
    document.body.appendChild(indicator);
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
}

// Initialize the content script
new MylZipContentScript();
