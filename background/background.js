// Myl.Zip Chromium Extension - Background Service Worker
// Intelligent thought tracking and typing-aware assistance
// 
// NOTE: Backend team is working on UUID format support. Currently accepting short format
// codes as fallback when UUIDs are requested to maintain functionality.

class MylZipBackground {
  constructor() {
    this.settings = null;
    this.thoughtData = new Map();
    this.activeTabs = new Set();
    this.typingServiceEnabled = true;
    this.apiClient = null;
    this.backendURL = 'https://api.myl.zip';
    this.connectionStatus = { status: 'unknown', timestamp: null };
    this.init();
  }

  async init() {
    console.log('Myl.Zip Background Service: Initializing...');
    console.log('Myl.Zip Background: Extension ID:', chrome.runtime.id);
    console.log('Myl.Zip Background: Extension origin:', `chrome-extension://${chrome.runtime.id}`);
    
    try {
      // Load settings and thought data
      await this.loadSettings();
      await this.loadThoughtData();
      
      // Initialize API client
      await this.initializeAPIClient();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize context menus
      this.setupContextMenus();
      
      // Setup periodic cleanup
      this.setupPeriodicTasks();
      
      // Clean up any invalid tabs from previous session
      await this.cleanupInvalidTabs();
      
      console.log('Myl.Zip Background Service: Ready');
      console.log('Settings loaded:', this.settings);
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
      // Load core settings from sync storage (smaller, syncs across devices)
      const syncResult = await chrome.storage.sync.get(['mylZipCoreSettings']);
      const coreSettings = syncResult.mylZipCoreSettings || {};
      
      // Load large data from local storage (device-specific)
      const localResult = await chrome.storage.local.get(['mylZipLargeSettings']);
      const largeSettings = localResult.mylZipLargeSettings || {};
      
      // Merge settings with defaults
      this.settings = { ...this.getDefaultSettings(), ...coreSettings, ...largeSettings };
      console.log('Settings loaded:', this.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  async saveSettings() {
    try {
      // Split settings into core (small) and large (device-specific) parts
      const { coreSettings, largeSettings } = this.splitSettings(this.settings);
      
      // Save core settings to sync storage
      await chrome.storage.sync.set({ mylZipCoreSettings: coreSettings });
      
      // Save large settings to local storage
      await chrome.storage.local.set({ mylZipLargeSettings: largeSettings });
      
      console.log('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      // Fallback: try to save to local storage only
      try {
        await chrome.storage.local.set({ mylZipSettings: this.settings });
        console.log('Settings saved to local storage as fallback');
      } catch (fallbackError) {
        console.error('Error saving settings to local storage:', fallbackError);
      }
    }
  }

  splitSettings(settings) {
    // Core settings (small, should sync across devices)
    const coreSettings = {
      // Core functionality
      typingThreshold: settings.typingThreshold,
      enableTypingIndicator: settings.enableTypingIndicator,
      enableClickActions: settings.enableClickActions,
      enableTypingAwareService: settings.enableTypingAwareService,
      typingAnalysisDelay: settings.typingAnalysisDelay,
      
      // Visual feedback
      enablePopupOverlay: settings.enablePopupOverlay,
      overlayAnimationDuration: settings.overlayAnimationDuration,
      enableVisualFeedback: settings.enableVisualFeedback,
      enableSoundFeedback: settings.enableSoundFeedback,
      soundVolume: settings.soundVolume,
      
      // Backend settings
      backendURL: settings.backendURL,
      enableBackendSync: settings.enableBackendSync,
      
      // Myl.Zip integration
      enableMylZipSync: settings.enableMylZipSync,
      mylZipEndpoint: settings.mylZipEndpoint,
      enableCrossTabSync: settings.enableCrossTabSync
    };

    // Large settings (device-specific, stored locally)
    const largeSettings = {
      // Thought tracking
      enableThoughtTracking: settings.enableThoughtTracking,
      thoughtPersistenceDuration: settings.thoughtPersistenceDuration,
      maxThoughtLength: settings.maxThoughtLength,
      
      // Run-on thought detection
      enableRunOnThoughtDetection: settings.enableRunOnThoughtDetection,
      runOnThoughtThreshold: settings.runOnThoughtThreshold,
      enableCursorProximityIndicators: settings.enableCursorProximityIndicators,
      proximityIndicatorStyle: settings.proximityIndicatorStyle,
      
      // Response triggers
      responseTriggerKeywords: settings.responseTriggerKeywords,
      autoInsertResponses: settings.autoInsertResponses,
      
      // Sensor integration
      enableMouseTracking: settings.enableMouseTracking,
      enableFocusTracking: settings.enableFocusTracking,
      enableScrollTracking: settings.enableScrollTracking,
      sensorSensitivity: settings.sensorSensitivity,
      
      // Encryption and device management (large objects)
      encryptionSetup: settings.encryptionSetup,
      deviceRegistration: settings.deviceRegistration,
      trustedDevices: settings.trustedDevices
    };

    return { coreSettings, largeSettings };
  }

  hashPassword(password) {
    // Simple hash function for storing password hash (not for security, just for identification)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async loadThoughtData() {
    try {
      const result = await chrome.storage.local.get(['mylZipThoughts']);
      const thoughts = result.mylZipThoughts || {};
      this.thoughtData = new Map(Object.entries(thoughts));
      console.log('Thought data loaded:', this.thoughtData.size, 'entries');
    } catch (error) {
      console.error('Error loading thought data:', error);
      this.thoughtData = new Map();
    }
  }

  async initializeAPIClient() {
    try {
      // Check if Chrome context is still valid before initializing
      if (!this.isChromeContextValid()) {
        console.warn('Myl.Zip Background: Chrome context invalid, skipping API client initialization');
        return;
      }

      // Load backend URL from settings
      const backendURL = this.settings.backendURL || this.backendURL;
      
      console.log('Myl.Zip Background: Backend URL configured as:', backendURL);
      
      // Note: API client is initialized in content scripts, not background
      // Background script handles coordination and settings management
      this.backendURL = backendURL;
      
      // Test connection by making a simple health check request (non-blocking)
      this.testBackendConnection().then(isHealthy => {
        if (isHealthy) {
          console.log('Myl.Zip Background: Backend connection established');
        } else {
          console.warn('Myl.Zip Background: Backend connection failed - will retry later');
        }
      }).catch(error => {
        console.warn('Myl.Zip Background: Backend connection test failed:', error.message);
      });
    } catch (error) {
      console.error('Myl.Zip Background: Failed to initialize backend connection:', error);
    }
  }

  async testBackendConnection() {
    try {
      // Check if Chrome context is still valid
      if (!this.isChromeContextValid()) {
        console.warn('Myl.Zip Background: Chrome context invalid, skipping health check');
        return false;
      }

      // Use the API client's simple request method to avoid CORS issues
      if (this.apiClient && typeof this.apiClient.makeSimpleRequest === 'function') {
        try {
          const data = await this.apiClient.makeSimpleRequest('GET', '/health');
          return data.status === 'ok' || data.status === 'healthy';
        } catch (apiError) {
          console.warn('Myl.Zip Background: API client health check failed, falling back to direct fetch');
        }
      }

      // Fallback to direct fetch if API client is not available
      const response = await fetch(`${this.backendURL}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns "ok" status, not "healthy"
        return data.status === 'ok' || data.status === 'healthy';
      }
      return false;
    } catch (error) {
      // Handle specific error types
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.warn('Myl.Zip Background: Extension context invalidated during health check');
        return false;
      } else if (error.name === 'AbortError') {
        console.error('Myl.Zip Background: Health check timed out after 10 seconds');
        return false;
      } else if (error.message && error.message.includes('Failed to fetch')) {
        console.error('Myl.Zip Background: Network error - cannot reach API server');
        console.error('Myl.Zip Background: This could be due to:');
        console.error('  - Network connectivity issues');
        console.error('  - API server being down');
        console.error('  - Firewall blocking the request');
        console.error('  - CORS policy restrictions');
        return false;
      } else {
        console.error('Myl.Zip Background: Health check failed:', error);
        return false;
      }
    }
  }

  isChromeContextValid() {
    try {
      // Test if Chrome extension APIs are available and valid
      return typeof chrome !== 'undefined' && 
             chrome.runtime && 
             chrome.runtime.getManifest && 
             chrome.storage && 
             chrome.storage.local;
    } catch (error) {
      console.warn('Myl.Zip Background: Chrome context validation failed:', error);
      return false;
    }
  }

  generateDeviceId() {
    // Generate or retrieve device ID
    let deviceId = this.settings.deviceRegistration?.deviceId;
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    return deviceId;
  }





  /**
   * Validate pairing code format
   * @param {string} code - Pairing code to validate
   * @returns {Object} - Validation result with format detection
   */
  validatePairingCode(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, format: 'unknown', error: 'Invalid code format' };
    }

    // UUID format: 8-4-4-4-12 pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(code)) {
      return { valid: true, format: 'uuid' };
    }

    // Short format: 12-character hex string
    const shortRegex = /^[0-9a-f]{12}$/i;
    if (shortRegex.test(code)) {
      return { valid: true, format: 'short' };
    }

    // Legacy format: 6-digit numeric
    const legacyRegex = /^[0-9]{6}$/;
    if (legacyRegex.test(code)) {
      return { valid: true, format: 'legacy' };
    }

    return { valid: false, format: 'unknown', error: 'Unrecognized code format' };
  }

  /**
   * Check if a string is a valid UUID format
   * @param {string} str - String to check
   * @returns {boolean} - True if valid UUID format
   */
  isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Retrieve NFT visual data using UUID from backend
   * @param {string} nftUuid - The NFT UUID to retrieve
   * @returns {Promise<Object>} - The NFT visual data and metadata
   */
  async retrieveNFTData(nftUuid) {
    try {
      console.log('Background: Retrieving NFT data for UUID:', nftUuid);
      
      const response = await fetch(`${this.backendURL}/api/v1/nfts/${nftUuid}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'chrome-extension',
          'X-Client-Version': chrome.runtime.getManifest().version
        }
      });

      if (response.ok) {
        const nftData = await response.json();
        console.log('Background: NFT data retrieved successfully:', nftData);
        return nftData;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Background: Error retrieving NFT data:', error);
      throw error;
    }
  }

  /**
   * Generate NFT pairing code locally using the NFT engine
   * @returns {Promise<string>} - The generated NFT pairing code
   */
  async generateNFTPairingCode() {
    try {
      console.log('Background: Generating NFT pairing code locally...');
      
      // Check if we have access to the NFT engine
      if (typeof MylZipNFTEngine === 'undefined') {
        // Try to load the NFT engine from the content script context
        console.log('Background: NFT Engine not available in background context, generating fallback code...');
        
        // Generate a fallback NFT code in short format (12-character hex) for compatibility
        const deviceId = this.generateDeviceId();
        const timestamp = Date.now();
        
        // Create a deterministic 12-character hex code based on device ID and timestamp
        // Use a hash-like approach to ensure it's always 12 characters
        const combined = deviceId + timestamp.toString();
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
          const char = combined.charCodeAt(i);
          hash = ((hash << 5) - hash + char) & 0xffffffff;
        }
        
        // Convert to 12-character hex string
        const nftCode = Math.abs(hash).toString(16).padStart(12, '0').substring(0, 12);
        
        console.log('Background: Generated fallback NFT pairing code (short format):', nftCode);
        return nftCode;
      }
      
      // If NFT engine is available, use it to generate a proper NFT
      const nftEngine = new MylZipNFTEngine();
      await nftEngine.waitForInit();
      
      // Generate a deterministic NFT based on device ID
      const deviceId = this.generateDeviceId();
      const nft = await nftEngine.generateDeterministicNFT(deviceId, 'geometric');
      
      // Extract the NFT ID and convert it to a valid short format if possible
      let nftCode;
      if (nft.id) {
        // Try to convert NFT ID to short format
        if (nft.id.length <= 12 && /^[0-9a-f]+$/i.test(nft.id)) {
          // NFT ID is already hex and short enough, pad to 12 characters
          nftCode = nft.id.padStart(12, '0').substring(0, 12);
        } else {
          // Convert NFT ID to short format using hash
          let hash = 0;
          for (let i = 0; i < nft.id.length; i++) {
            const char = nft.id.charCodeAt(i);
            hash = ((hash << 5) - hash + char) & 0xffffffff;
          }
          nftCode = Math.abs(hash).toString(16).padStart(12, '0').substring(0, 12);
        }
      } else {
        // Generate deterministic short format code from device ID
        let hash = 0;
        for (let i = 0; i < deviceId.length; i++) {
          const char = deviceId.charCodeAt(i);
          hash = ((hash << 5) - hash + char) & 0xffffffff;
        }
        nftCode = Math.abs(hash).toString(16).padStart(12, '0').substring(0, 12);
      }
      
      console.log('Background: Generated NFT pairing code (short format):', nftCode);
      return nftCode;
      
    } catch (error) {
      console.error('Background: Error generating NFT pairing code:', error);
      
      // Fallback to a deterministic short format code
      const deviceId = this.generateDeviceId();
      let hash = 0;
      for (let i = 0; i < deviceId.length; i++) {
        const char = deviceId.charCodeAt(i);
        hash = ((hash << 5) - hash + char) & 0xffffffff;
      }
      const fallbackCode = Math.abs(hash).toString(16).padStart(12, '0').substring(0, 12);
      
      console.log('Background: Using fallback NFT pairing code (short format):', fallbackCode);
      return fallbackCode;
    }
  }

  /**
   * Create local trust relationship after successful backend verification
   * @param {string} pairingCode - The pairing code that was verified
   * @param {Object} apiResult - The result from the backend API
   * @returns {Object} - Trust relationship creation result
   */
  async createLocalTrustRelationship(pairingCode, apiResult) {
    try {
      console.log('Background: Creating local trust relationship after successful verification');
      
      const currentDeviceId = this.generateDeviceId();
      const currentDeviceInfo = {
        name: 'Chrome Extension Device',
        type: 'chrome-extension',
        version: chrome.runtime.getManifest().version,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      // Extract target device info from API result if available
      const targetDeviceInfo = apiResult.targetDevice || {
        name: 'Paired Device',
        type: 'chrome-extension',
        timestamp: new Date().toISOString()
      };
      
      const targetDeviceId = apiResult.targetDeviceId || `paired_device_${Date.now()}`;
      
      const now = new Date().toISOString();
      
      // Create trust entry for the current device (if not already exists)
      const currentDeviceTrust = {
        deviceId: currentDeviceId,
        deviceInfo: currentDeviceInfo,
        permissions: ['read', 'write'],
        trustedAt: now,
        trustLevel: 2,
        isSelfTrust: false,
        pairedVia: 'pairing-code',
        pairingCode: pairingCode
      };
      
      // Create trust entry for the target device
      const targetDeviceTrust = {
        deviceId: targetDeviceId,
        deviceInfo: targetDeviceInfo,
        permissions: ['read', 'write'],
        trustedAt: now,
        trustLevel: 2,
        isSelfTrust: false,
        pairedVia: 'pairing-code',
        pairingCode: pairingCode
      };
      
      // Initialize trusted devices array if it doesn't exist
      if (!this.settings.trustedDevices) {
        this.settings.trustedDevices = [];
      }
      
      // Check if devices already exist in trusted list
      const existingCurrent = this.settings.trustedDevices.find(d => d.deviceId === currentDeviceId);
      const existingTarget = this.settings.trustedDevices.find(d => d.deviceId === targetDeviceId);
      
      let addedDevices = 0;
      
      if (!existingCurrent) {
        this.settings.trustedDevices.push(currentDeviceTrust);
        addedDevices++;
        console.log('Background: Added current device to trusted list');
      }
      
      if (!existingTarget) {
        this.settings.trustedDevices.push(targetDeviceTrust);
        addedDevices++;
        console.log('Background: Added target device to trusted list');
      }
      
      // Save settings
      await this.saveSettings();
      
      console.log('Background: Trust relationship created successfully');
      console.log('Background: Total trusted devices now:', this.settings.trustedDevices.length);
      console.log('Background: Added', addedDevices, 'new devices to trusted list');
      
      return {
        success: true,
        currentDevice: currentDeviceTrust,
        targetDevice: targetDeviceTrust,
        totalDevices: this.settings.trustedDevices.length,
        addedDevices: addedDevices
      };
      
    } catch (error) {
      console.error('Background: Error creating local trust relationship:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }



  async isValidTab(tabId) {
    try {
      await chrome.tabs.get(tabId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async cleanupInvalidTabs() {
    const tabsToCheck = Array.from(this.activeTabs);
    for (const tabId of tabsToCheck) {
      if (!(await this.isValidTab(tabId))) {
        this.activeTabs.delete(tabId);
        console.log('Cleaned up invalid tab from activeTabs:', tabId);
      }
    }
  }

  async createSelfTrust(deviceId, deviceInfo) {
    try {
      // Create self-trust relationship via API
      const trustData = {
        sourceDeviceId: deviceId,
        targetDeviceId: deviceId,
        trustLevel: 3, // Self-trust (highest level)
        encryptedTrustData: JSON.stringify({
          type: 'self-trust',
          deviceInfo: deviceInfo,
          createdAt: new Date().toISOString()
        }),
        isActive: true
      };

      const response = await fetch(`${this.backendURL}/api/v1/encrypted/devices/trust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...trustData,
          _metadata: {
            clientType: 'chrome-extension',
            clientVersion: chrome.runtime.getManifest().version,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Background: Self-trust relationship created successfully via API:', result);
        
        // Also create local self-trust as backup since API might not immediately return the data
        try {
          console.log('Background: Creating local self-trust as backup...');
          const localResult = await this.createLocalSelfTrust(deviceId, deviceInfo);
          console.log('Background: Local self-trust backup created:', localResult);
        } catch (localError) {
          console.warn('Background: Failed to create local self-trust backup:', localError);
        }
        
        return result;
      } else if (response.status === 404) {
        // Backend doesn't support trust endpoint yet, create local self-trust
        console.log('Background: Trust endpoint not available, creating local self-trust');
        return this.createLocalSelfTrust(deviceId, deviceInfo);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Background: Failed to create self-trust relationship:', error);
      throw error;
    }
  }

  async createLocalSelfTrust(deviceId, deviceInfo) {
    try {
      // Create local self-trust entry in settings
      const selfTrustDevice = {
        deviceId: deviceId,
        deviceInfo: deviceInfo,
        permissions: ['read', 'write', 'admin'],
        trustedAt: new Date().toISOString(),
        trustLevel: 3,
        isSelfTrust: true
      };

      // Initialize trusted devices array if it doesn't exist
      if (!this.settings.trustedDevices) {
        this.settings.trustedDevices = [];
      }

      // Check if self-trust already exists
      const existingSelfTrust = this.settings.trustedDevices.find(device => 
        device.deviceId === deviceId && device.isSelfTrust
      );

      if (!existingSelfTrust) {
        this.settings.trustedDevices.push(selfTrustDevice);
        await this.saveSettings();
        console.log('Background: Local self-trust relationship created and saved:', selfTrustDevice);
        console.log('Background: Total trusted devices now:', this.settings.trustedDevices.length);
        console.log('Background: Settings after save:', this.settings.trustedDevices);
      } else {
        console.log('Background: Self-trust relationship already exists');
      }

      return { success: true, device: selfTrustDevice };
    } catch (error) {
      console.error('Background: Failed to create local self-trust:', error);
      throw error;
    }
  }

  async saveThoughtData() {
    try {
      const thoughts = Object.fromEntries(this.thoughtData);
      await chrome.storage.local.set({ mylZipThoughts: thoughts });
      console.log('Thought data saved');
    } catch (error) {
      console.error('Error saving thought data:', error);
    }
  }

  getDefaultSettings() {
    return {
      // Core settings
      typingThreshold: 100,
      enableTypingIndicator: true,
      enableClickActions: true,
      enableTypingAwareService: true,
      typingAnalysisDelay: 500,
      
      // Visual feedback
      enablePopupOverlay: true,
      overlayAnimationDuration: 3000,
      enableVisualFeedback: true,
      enableSoundFeedback: false,
      soundVolume: 50,
      
      // Thought tracking
      enableThoughtTracking: true,
      thoughtPersistenceDuration: 24 * 60 * 60 * 1000, // 24 hours
      maxThoughtLength: 1000,
      
      // Privacy and security
      excludePII: true, // Exclude Personal Identifiable Information
      excludePasswords: true, // Always exclude password fields
      dataClassification: true, // Enable data classification
      
      // Run-on thought detection
      enableRunOnThoughtDetection: true,
      runOnThoughtThreshold: 50,
      enableCursorProximityIndicators: true,
      proximityIndicatorStyle: 'pulse',
      
      // Response triggers
      responseTriggerKeywords: ['help', 'assist', 'guide', 'suggest', 'recommend'],
      autoInsertResponses: false,
      
      // Backend settings
      backendURL: 'https://api.myl.zip',
      enableBackendSync: true,
      
      // Myl.Zip integration
      enableMylZipSync: true,
      mylZipEndpoint: 'https://myl.zip/api/thoughts',
      enableCrossTabSync: true,
      
      // Sensor integration
      enableMouseTracking: true,
      enableFocusTracking: true,
      enableScrollTracking: true,
      sensorSensitivity: 0.7,
      
      // Encryption and device management
      encryptionSetup: {
        isSetup: false,
        setupDate: null,
        passwordHash: null,
        interactionData: null
      },
      deviceRegistration: {
        isRegistered: false,
        registrationDate: null,
        deviceInfo: null
      },
      trustedDevices: [],
      allowShortFormatFallback: true // Allow short format fallback for UUID requests
    };
  }

  setupEventListeners() {
    // Tab events
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });

    // Message handling
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Command handling
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      // Main context menu
      chrome.contextMenus.create({
        id: 'myl-zip-main',
        title: 'Myl.Zip Assistant',
        contexts: ['all']
      });

      // Submenu items
      chrome.contextMenus.create({
        id: 'myl-zip-settings',
        parentId: 'myl-zip-main',
        title: '⚙️ Settings',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'myl-zip-quick-settings',
        parentId: 'myl-zip-main',
        title: '🔧 Quick Settings',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'myl-zip-separator1',
        parentId: 'myl-zip-main',
        type: 'separator',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'myl-zip-toggle-service',
        parentId: 'myl-zip-main',
        title: '🔄 Toggle Typing Service',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'myl-zip-reset-counter',
        parentId: 'myl-zip-main',
        title: '🔄 Reset Counter',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'myl-zip-separator2',
        parentId: 'myl-zip-main',
        type: 'separator',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'myl-zip-help',
        parentId: 'myl-zip-main',
        title: '❓ Help & Documentation',
        contexts: ['all']
      });
    });

    // Context menu click handler
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  setupPeriodicTasks() {
    // Clean up old thought data every hour
    setInterval(() => {
      this.cleanupOldThoughts();
    }, 60 * 60 * 1000);

    // Save thought data every 5 minutes
    setInterval(() => {
      this.saveThoughtData();
    }, 5 * 60 * 1000);

    // Clean up invalid tabs every 2 minutes
    setInterval(() => {
      this.cleanupInvalidTabs();
    }, 2 * 60 * 1000);

    // Sync with Myl.Zip endpoint if enabled
    if (this.settings.enableMylZipSync) {
      setInterval(() => {
        this.syncWithMylZip();
      }, 10 * 60 * 1000); // Every 10 minutes
    }
  }

  async handleTabActivated(activeInfo) {
    const tabId = activeInfo.tabId;
    
    // Verify tab exists before adding to activeTabs
    if (await this.isValidTab(tabId)) {
      this.activeTabs.add(tabId);
      
      // Save current thought before switching
      await this.saveCurrentThought(tabId);
      
      // Load thought for new tab
      await this.loadThoughtForTab(tabId);
      
      // Update badge
      this.updateBadge(tabId);
    } else {
      console.log('Tab activation for invalid tab ID:', tabId);
    }
  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Check if content script is already injected
      if (this.isInjectableUrl(tab.url)) {
        try {
          // Check if content script is already present
          const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              return typeof window.mylZipContentScript !== 'undefined';
            }
          });
          
          if (!results[0]?.result) {
            // Content script not present, inject it
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });
            console.log('Content script injected successfully for tab:', tabId);
          } else {
            console.log('Content script already present for tab:', tabId);
          }
        } catch (error) {
          console.log('Could not inject content script for tab:', tabId, 'Error:', error.message);
        }
      } else {
        console.log('Skipping content script injection for non-injectable URL:', tab.url);
      }
    }
  }

  isInjectableUrl(url) {
    if (!url) return false;
    
    // List of URL patterns that cannot be injected
    const nonInjectablePatterns = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'edge://',
      'about:',
      'file://',
      'data:',
      'javascript:'
    ];
    
    return !nonInjectablePatterns.some(pattern => url.startsWith(pattern));
  }

  async handleTabRemoved(tabId) {
    // Save thought data before tab closes (if tab still exists)
    try {
      await this.saveCurrentThought(tabId);
    } catch (error) {
      // Tab might already be closed, that's okay
      console.log('Could not save thought for closing tab:', tabId);
    }
    
    // Remove from active tabs
    this.activeTabs.delete(tabId);
    
    // Clean up thought data
    this.thoughtData.delete(tabId);
    
    console.log('Tab removed and cleaned up:', tabId);
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('Background: Received message:', message.type, 'from:', sender);
      switch (message.type) {
            case 'GET_SETTINGS':
              console.log('Background: Sending settings:', this.settings);
              sendResponse({ settings: this.settings });
              break;

            case 'UPDATE_SETTINGS':
              this.settings = { ...this.settings, ...message.settings };
              await this.saveSettings();
              sendResponse({ success: true });
              break;

            case 'SAVE_THOUGHT':
              if (sender.tab && sender.tab.id) {
                await this.saveThought(sender.tab.id, message.thought);
                sendResponse({ success: true });
              } else {
                sendResponse({ error: 'No active tab found' });
              }
              break;
              
            case 'BACKEND_HEALTH_CHECK':
              try {
                const isHealthy = await this.testBackendConnection();
                sendResponse({ success: true, isHealthy: isHealthy });
              } catch (error) {
                sendResponse({ success: false, error: error.message });
              }
              break;
              
            case 'UPDATE_BACKEND_URL':
              try {
                this.backendURL = message.url;
                this.settings.backendURL = message.url;
                await this.saveSettings();
                sendResponse({ success: true });
              } catch (error) {
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'CONNECTION_STATUS_UPDATE':
              try {
                this.connectionStatus = {
                  status: message.status,
                  timestamp: message.timestamp,
                  lastUpdate: Date.now()
                };
                console.log('Myl.Zip Background: Connection status updated:', message.status);
                sendResponse({ success: true });
              } catch (error) {
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GET_CONNECTION_STATUS':
              try {
                const status = this.connectionStatus || { status: 'unknown', timestamp: null };
                sendResponse({ success: true, status: status });
              } catch (error) {
                sendResponse({ success: false, error: error.message });
              }
              break;
              
            case 'CHECK_BACKEND_STATUS':
              try {
                const isConnected = await this.testBackendConnection();
                sendResponse({ connected: isConnected });
              } catch (error) {
                sendResponse({ connected: false, error: error.message });
              }
              break;
              
            case 'CHECK_ENCRYPTION_STATUS':
              try {
                // Check if encryption service is available
                const isEncrypted = this.settings.encryptionSetup && this.settings.encryptionSetup.isSetup;
                sendResponse({ encrypted: isEncrypted });
              } catch (error) {
                sendResponse({ encrypted: false, error: error.message });
              }
              break;
              
            case 'CHECK_DEVICE_STATUS':
              try {
                const isRegistered = this.settings.deviceRegistration && this.settings.deviceRegistration.isRegistered;
                sendResponse({ registered: isRegistered });
              } catch (error) {
                sendResponse({ registered: false, error: error.message });
              }
              break;
              
            case 'CHECK_PAIRING_STATUS':
              try {
                // Check if there are any trusted devices
                const hasTrustedDevices = this.settings.trustedDevices && this.settings.trustedDevices.length > 0;
                sendResponse({ paired: hasTrustedDevices });
              } catch (error) {
                sendResponse({ paired: false, error: error.message });
              }
              break;

            // Device Management Messages
            case 'REGISTER_DEVICE':
              try {
                const { deviceInfo } = message;
                console.log('Background: Registering device with info:', deviceInfo);
                
                // Register device with production API
                const registrationData = {
                  deviceId: this.generateDeviceId(),
                  deviceInfo: deviceInfo,
                  clientType: 'chrome-extension',
                  clientVersion: chrome.runtime.getManifest().version,
                  extensionId: chrome.runtime.id,
                  capabilities: ['encrypt', 'decrypt', 'share'],
                  timestamp: new Date().toISOString()
                };

                const response = await fetch(`${this.backendURL}/api/v1/encrypted/devices/register`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Type': 'chrome-extension',
                    'X-Client-Version': chrome.runtime.getManifest().version
                  },
                  body: JSON.stringify(registrationData)
                });

                if (response.ok) {
                  const result = await response.json();
                  
                  // Store device registration in settings
                  this.settings.deviceRegistration = {
                    isRegistered: true,
                    registrationDate: new Date().toISOString(),
                    deviceInfo: deviceInfo,
                    deviceId: registrationData.deviceId,
                    apiResponse: result
                  };
                  
                  await this.saveSettings();
                  console.log('Background: Device registered successfully with API');
                  
                  // Create self-trust relationship
                  try {
                    console.log('Background: Attempting to create self-trust relationship...');
                    const trustResult = await this.createSelfTrust(registrationData.deviceId, deviceInfo);
                    console.log('Background: Self-trust relationship created successfully:', trustResult);
                  } catch (trustError) {
                    console.warn('Background: Failed to create self-trust relationship:', trustError);
                    // Don't fail registration if self-trust fails
                  }
                  
                  sendResponse({ success: true, message: 'Device registered successfully', data: result });
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `HTTP ${response.status}`);
                }
              } catch (error) {
                console.error('Background: Error registering device:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GET_TRUSTED_DEVICES':
              try {
                let devices = [];
                
                // First try to get trusted devices from API
                try {
                  const deviceId = this.generateDeviceId();
                  const response = await fetch(`${this.backendURL}/api/v1/encrypted/devices/trusted?deviceId=${encodeURIComponent(deviceId)}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  });

                  if (response.ok) {
                    const result = await response.json();
                    devices = result.devices || [];
                    console.log('Background: Retrieved trusted devices from API:', devices.length);
                    console.log('Background: API trusted devices response:', result);
                  } else {
                    console.log('Background: API trusted devices endpoint not available, using local data');
                    console.log('Background: API response status:', response.status, response.statusText);
                  }
                } catch (apiError) {
                  console.log('Background: API trusted devices request failed, using local data:', apiError.message);
                }

                // If no devices from API, use local trusted devices
                if (devices.length === 0 && this.settings.trustedDevices) {
                  devices = this.settings.trustedDevices;
                  console.log('Background: Using local trusted devices:', devices.length);
                  console.log('Background: Local trusted devices data:', devices);
                } else if (devices.length === 0) {
                  console.log('Background: No devices from API and no local trusted devices');
                  console.log('Background: Settings trustedDevices:', this.settings.trustedDevices);
                }

                console.log('Background: Sending trusted devices response:', { success: true, devices: devices });
                sendResponse({ success: true, devices: devices });
              } catch (error) {
                console.error('Background: Error getting trusted devices:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GENERATE_PAIRING_CODE':
              try {
                const { format = 'uuid', expiresIn = 300 } = message;
                const deviceId = `chrome-extension-${chrome.runtime.id}`;
                
                console.log('Background: Generating pairing code with format:', format);
                
                // Handle NFT format - backend now supports NFT generation with UUID
                // Note: Backend generates UUID for NFT, frontend uses UUID for pairing
                // NFT visual data can be retrieved for verification algorithms
                if (format === 'nft') {
                  console.log('Background: NFT format requested, backend will generate UUID...');
                  // Continue with API call - backend now handles NFT format properly
                }
                
                // For non-NFT formats, use the API
                console.log('Background: Using endpoint:', `${this.backendURL}/api/v1/device-registration/pairing-codes`);
                console.log('Background: Extension ID:', chrome.runtime.id);
                console.log('Background: Extension origin would be:', `chrome-extension://${chrome.runtime.id}`);
                console.log('Background: Request body:', JSON.stringify({
                  deviceId: deviceId,
                  expiresIn: expiresIn,
                  format: format
                }));
                
                // Generate pairing code via production API with format support
                const response = await fetch(`${this.backendURL}/api/v1/device-registration/pairing-codes`, {
                  method: 'POST',
                  mode: 'cors',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    deviceId: deviceId,
                    expiresIn: expiresIn,
                    format: format,
                    _metadata: {
                      clientType: 'chrome-extension',
                      clientVersion: chrome.runtime.getManifest().version,
                      timestamp: new Date().toISOString()
                    }
                  }),
                  signal: AbortSignal.timeout(15000) // 15 second timeout
                });

                console.log('Background: Response status:', response.status, response.statusText);
                console.log('Background: Response headers:', Object.fromEntries(response.headers.entries()));
                console.log('Background: Response URL:', response.url);
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Background: Production API pairing code response:', result);
                  console.log('Background: Response keys:', Object.keys(result));
                  console.log('Background: Requested format:', format, 'API returned code:', result.pairingCode);
                  
                  // Handle NFT format responses from backend first
                  if (result.format === 'nft') {
                    console.log('Background: NFT format response detected, checking for NFT UUID...');
                    console.log('Background: NFT response structure:', {
                      format: result.format,
                      message: result.message,
                      keys: Object.keys(result),
                      nftUuid: result.nftUuid,
                      uuid: result.uuid,
                      nft: result.nft,
                      pairingCode: result.pairingCode,
                      expiresAt: result.expiresAt,
                      status: result.status,
                      state: result.state
                    });
                    
                    // Log the full response for debugging
                    console.log('Background: Full NFT response:', JSON.stringify(result, null, 2));
                    
                    // For NFT format, the backend should return a UUID
                    // Check multiple possible fields where the UUID might be stored
                    const nftUuid = result.nftUuid || result.uuid || result.nft || result.pairingCode;
                    
                                         if (nftUuid && nftUuid !== 'null' && nftUuid !== 'undefined') {
                      console.log('Background: NFT UUID found:', nftUuid);
                      
                      // Store the NFT pairing code with UUID
                      if (!this.settings.pairingCodes) {
                        this.settings.pairingCodes = {};
                      }
                      this.settings.pairingCodes.current = {
                        code: nftUuid,
                        format: 'uuid', // NFT codes are now UUIDs from backend
                        requestedFormat: format,
                        expiresAt: result.expiresAt,
                        generatedAt: new Date().toISOString(),
                        nftStyle: true, // Flag to indicate this is an NFT pairing code
                        nftUuid: nftUuid, // Store the NFT UUID for later retrieval
                        nftMetadata: result.nftMetadata || null // Store any NFT metadata
                      };
                      this.settings.currentPairingCode = nftUuid;
                      await this.saveSettings();
                      
                      console.log('Background: Stored NFT pairing code with UUID:', nftUuid);
                      sendResponse({ 
                        success: true, 
                        pairingCode: nftUuid,
                        format: 'uuid',
                        requestedFormat: format,
                        expiresAt: result.expiresAt,
                        nftStyle: true,
                        nftUuid: nftUuid,
                        nftMetadata: result.nftMetadata || null
                      });
                      return; // Exit early since we handled NFT format
                    } else {
                      // If no UUID found, check if we need to generate one locally or if this is a pending state
                      console.warn('Background: NFT format response missing NFT UUID. Response details:', {
                        format: result.format,
                        message: result.message,
                        keys: Object.keys(result),
                        hasNftUuid: !!result.nftUuid,
                        hasUuid: !!result.uuid,
                        hasNft: !!result.nft,
                        hasPairingCode: !!result.pairingCode,
                        fullResponse: result
                      });
                      
                      // Check if this is a pending state where the backend is still generating the NFT
                      // Look for various indicators that NFT generation is in progress
                      const isPendingGeneration = (
                        (result.message && (
                          result.message.includes('generated successfully') ||
                          result.message.includes('generation in progress') ||
                          result.message.includes('processing') ||
                          result.message.includes('pending') ||
                          result.message.includes('queued')
                        )) ||
                        (result.status && result.status === 'pending') ||
                        (result.state && result.state === 'processing')
                      );
                      
                      // Also check if this is a successful response but the NFT is still being generated
                      // This can happen when the backend accepts the request but processes it asynchronously
                      const isAsyncProcessing = (
                        result.success === true && 
                        !result.nftUuid && 
                        !result.uuid && 
                        !result.nft && 
                        !result.pairingCode &&
                        result.format === 'nft'
                      );
                      
                      if (isPendingGeneration || isAsyncProcessing) {
                        console.log('Background: NFT generation appears to be in progress, checking for pending status...');
                        console.log('Background: Pending indicators found:', {
                          message: result.message,
                          status: result.status,
                          state: result.state,
                          isAsyncProcessing: isAsyncProcessing,
                          success: result.success
                        });
                        
                        // Handle pending state properly - this is not an error, just a waiting state
                        // For now, just return success with a pending flag to avoid the error message
                        sendResponse({ 
                          success: true, 
                          pairingCode: 'pending',
                          format: 'nft',
                          requestedFormat: format,
                          expiresAt: result.expiresAt,
                          pending: true,
                          message: 'NFT generation in progress - please wait...'
                        });
                        return;
                      }
                      
                      // Log the full response for debugging
                      console.error('Background: Full NFT response that failed validation:', JSON.stringify(result, null, 2));
                      
                      // Check if we can fall back to a different approach
                      if (result.pairingCode && result.pairingCode !== 'null' && result.pairingCode !== 'undefined') {
                        console.log('Background: Attempting fallback to use pairingCode as NFT UUID');
                        const fallbackUuid = result.pairingCode;
                        
                        // Store the fallback NFT pairing code
                        if (!this.settings.pairingCodes) {
                          this.settings.pairingCodes = {};
                        }
                        this.settings.pairingCodes.current = {
                          code: fallbackUuid,
                          format: 'uuid',
                          requestedFormat: format,
                          expiresAt: result.expiresAt,
                          generatedAt: new Date().toISOString(),
                          nftStyle: true,
                          nftUuid: fallbackUuid,
                          nftMetadata: result.nftMetadata || null,
                          fallbackUsed: true // Flag to indicate this was a fallback
                        };
                        this.settings.currentPairingCode = fallbackUuid;
                        await this.saveSettings();
                        
                        console.log('Background: Stored fallback NFT pairing code with UUID:', fallbackUuid);
                        sendResponse({ 
                          success: true, 
                          pairingCode: fallbackUuid,
                          format: 'uuid',
                          requestedFormat: format,
                          expiresAt: result.expiresAt,
                          nftStyle: true,
                          nftUuid: fallbackUuid,
                          nftMetadata: result.nftMetadata || null,
                          fallbackUsed: true
                        });
                        return;
                      }
                      
                                             // If we get here, the backend didn't provide a valid NFT UUID and it's not pending
                       // This suggests the backend doesn't support NFT format or there's an error
                       console.error('Background: Backend does not support NFT format or returned invalid response');
                       
                       // Fall back to generating a local UUID and using the response as metadata
                       const fallbackUuid = this.generateLocalUUID();
                       console.log('Background: Generated fallback UUID:', fallbackUuid);
                       
                       // Store the fallback NFT pairing code
                       if (!this.settings.pairingCodes) {
                         this.settings.pairingCodes = {};
                       }
                       this.settings.pairingCodes.current = {
                         code: fallbackUuid,
                         format: 'uuid',
                         requestedFormat: format,
                         expiresAt: result.expiresAt,
                         generatedAt: new Date().toISOString(),
                         nftStyle: true,
                         nftUuid: fallbackUuid,
                         nftMetadata: result.nftMetadata || result || null,
                         fallbackUsed: true, // Flag to indicate this was a fallback
                         backendResponse: result // Store the original backend response for debugging
                       };
                       this.settings.currentPairingCode = fallbackUuid;
                       await this.saveSettings();
                       
                       console.log('Background: Stored fallback NFT pairing code with UUID:', fallbackUuid);
                       sendResponse({ 
                         success: true, 
                         pairingCode: fallbackUuid,
                         format: 'uuid',
                         requestedFormat: format,
                         expiresAt: result.expiresAt,
                         nftStyle: true,
                         nftUuid: fallbackUuid,
                         nftMetadata: result.nftMetadata || result || null,
                         fallbackUsed: true,
                         warning: 'Backend NFT support incomplete, using local UUID'
                       });
                       return;
                    }
                  }
                  
                  // Check if the API response contains the expected pairingCode field for non-NFT formats
                  if (!result.pairingCode) {
                    console.error('Background: API response missing pairingCode field:', result);
                    throw new Error('API response missing pairingCode field. Response: ' + JSON.stringify(result));
                  }
                  
                  // Validate the returned pairing code format
                  const validation = this.validatePairingCode(result.pairingCode);
                  console.log('Background: Validation result:', validation);
                  console.log('Background: API returned code:', result.pairingCode, 'Length:', result.pairingCode.length);
                  
                  if (!validation.valid) {
                    console.error('Background: API returned invalid pairing code format:', result.pairingCode);
                    console.error('Background: Validation details:', validation);
                    throw new Error(`API returned invalid format: ${result.pairingCode}. ${validation.error}`);
                  }
                  
                  console.log('Background: API returned valid pairing code:', result.pairingCode, 'detected format:', validation.format, 'requested format:', format);
                  
                  // Check if the API returned the requested format
                  if (validation.format !== format) {
                    console.warn('Background: Format mismatch! Requested:', format, 'but got:', validation.format);
                    console.warn('Background: This suggests the backend API may not support the format parameter yet');
                    
                    // If we requested UUID but got short format, handle gracefully since backend team is working on UUID support
                    if (format === 'uuid' && validation.format === 'short') {
                      console.warn('Background: Backend returned short format instead of UUID. Backend team is working on UUID support.');
                      
                      // Always accept short format as fallback for now since backend doesn't support UUIDs yet
                      console.log('Background: Accepting short format as fallback for UUID request (backend UUID support pending)');
                      
                      // Update the requested format to match what we actually got to avoid confusion
                      format = validation.format;
                    }
                  }
                  
                  // Store the new pairing code in settings
                  if (!this.settings.pairingCodes) {
                    this.settings.pairingCodes = {};
                  }
                  this.settings.pairingCodes.current = {
                    code: result.pairingCode,
                    format: validation.format,
                    requestedFormat: format,
                    expiresAt: result.expiresAt,
                    generatedAt: new Date().toISOString()
                  };
                  this.settings.currentPairingCode = result.pairingCode;
                  await this.saveSettings();
                  
                  console.log('Background: Generated and stored pairing code:', result.pairingCode);
                  sendResponse({ 
                    success: true, 
                    pairingCode: result.pairingCode,
                    format: validation.format, // Return the actual format detected
                    requestedFormat: format,   // Include what was requested
                    expiresAt: result.expiresAt
                  });
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `HTTP ${response.status}`);
                }
              } catch (error) {
                console.error('Background: Error generating pairing code:', error);
                console.error('Background: Error details:', {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                  cause: error.cause
                });
                console.error('Background: Error type:', typeof error);
                console.error('Background: Error constructor:', error.constructor.name);
                
                // Provide more specific error messages and fallback
                let errorMessage = error.message;
                if (error.name === 'AbortError') {
                  errorMessage = 'Request timed out after 15 seconds. Please check your network connection.';
                } else if (error.message && error.message.includes('Failed to fetch')) {
                  errorMessage = 'Cannot connect to API server. Please check your network connection and try again.';
                }
                
                // Send error response
                sendResponse({ success: false, error: errorMessage });
              }
              break;

            case 'VERIFY_PAIRING_CODE':
              try {
                const { pairingCode } = message;
                const deviceId = `chrome-extension-${chrome.runtime.id}`;
                
                // Validate pairing code format using new validation method
                const validation = this.validatePairingCode(pairingCode);
                if (!validation.valid) {
                  console.log('Background: Invalid pairing code format:', pairingCode, 'Error:', validation.error);
                  sendResponse({ success: false, error: `Invalid pairing code format: ${validation.error}` });
                  return;
                }
                
                console.log('Background: Valid pairing code format detected:', validation.format);
                
                // Verify UUID pairing code via production API
                const response = await fetch(`${this.backendURL}/api/v1/device-registration/pair`, {
                  method: 'POST',
                  mode: 'cors',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Type': 'chrome-extension',
                    'X-Client-Version': chrome.runtime.getManifest().version,
                    'X-Device-ID': deviceId
                  },
                  body: JSON.stringify({
                    deviceId: deviceId,
                    pairingCode: pairingCode,
                    encryptedTrustData: "chrome-extension-trust-data"
                  })
                });

                if (response.ok) {
                  const result = await response.json();
                  console.log('Background: Production API pairing verification successful');
                  console.log('Background: API response data:', result);
                  
                  // Create local trust relationship after successful backend verification
                  const trustResult = await this.createLocalTrustRelationship(pairingCode, result);
                  
                  sendResponse({ success: true, data: { ...result, trustRelationship: trustResult } });
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `HTTP ${response.status}`);
                }
              } catch (error) {
                console.error('Background: Error verifying pairing code:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'REMOVE_TRUSTED_DEVICE':
              try {
                const { deviceId } = message;
                // Forward to active tab's content script
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (activeTab) {
                  const response = await chrome.tabs.sendMessage(activeTab.id, { 
                    type: 'REMOVE_TRUSTED_DEVICE', 
                    deviceId: deviceId 
                  });
                  sendResponse(response);
                } else {
                  sendResponse({ success: false, error: 'No active tab found' });
                }
              } catch (error) {
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'SETUP_ENCRYPTION':
              try {
                const { password, interactionData } = message;
                console.log('Background: Setting up encryption with password');
                
                // Store encryption setup in settings
                this.settings.encryptionSetup = {
                  isSetup: true,
                  setupDate: new Date().toISOString(),
                  passwordHash: this.hashPassword(password), // Don't store plain password
                  interactionData: interactionData
                };
                
                await this.saveSettings();
                console.log('Background: Encryption setup completed and saved');
                sendResponse({ success: true, message: 'Encryption setup completed' });
              } catch (error) {
                console.error('Background: Error setting up encryption:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'CLEAR_DEVICE_DATA':
              try {
                console.log('Background: Clearing device data');
                
                // Clear encryption and device data from settings
                this.settings.encryptionSetup = {
                  isSetup: false,
                  setupDate: null,
                  passwordHash: null,
                  interactionData: null
                };
                this.settings.deviceRegistration = {
                  isRegistered: false,
                  registrationDate: null,
                  deviceInfo: null
                };
                this.settings.trustedDevices = [];
                
                await this.saveSettings();
                console.log('Background: Device data cleared');
                sendResponse({ success: true, message: 'Device data cleared successfully' });
              } catch (error) {
                console.error('Background: Error clearing device data:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GET_ENCRYPTION_STATUS':
              try {
                // Get status from background script settings
                const status = {
                  isEncryptionSetup: this.settings.encryptionSetup?.isSetup || false,
                  isDeviceRegistered: this.settings.deviceRegistration?.isRegistered || false,
                  trustedDevicesCount: this.settings.trustedDevices?.length || 0
                };
                console.log('Background: Returning encryption status:', status);
                console.log('Background: Settings encryptionSetup:', this.settings.encryptionSetup);
                sendResponse({ success: true, status: status });
              } catch (error) {
                console.error('Background: Error getting encryption status:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GET_CURRENT_PAIRING_CODE':
              try {
                // Get current pairing code from settings or generate a new one
                const currentPairingCodeData = this.settings.pairingCodes?.current;
                
                if (currentPairingCodeData && currentPairingCodeData.code) {
                  console.log('Background: Returning current pairing code:', currentPairingCodeData.code);
                  sendResponse({ 
                    success: true, 
                    pairingCode: currentPairingCodeData.code,
                    format: currentPairingCodeData.format,
                    expiresAt: currentPairingCodeData.expiresAt,
                    nftStyle: currentPairingCodeData.nftStyle || false,
                    nftUuid: currentPairingCodeData.nftUuid || null
                  });
                } else {
                  // No current pairing code, generate a new one via production API
                  console.log('Background: No current pairing code, generating new one via production API...');
                  
                  const deviceId = `chrome-extension-${chrome.runtime.id}`;
                  const response = await fetch(`${this.backendURL}/api/v1/device-registration/pairing-codes`, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      deviceId: deviceId,
                      expiresIn: 300, // 5 minutes
                      format: 'uuid', // Default to UUID format
                      _metadata: {
                        clientType: 'chrome-extension',
                        clientVersion: chrome.runtime.getManifest().version,
                        timestamp: new Date().toISOString()
                      }
                    })
                  });

                  if (response.ok) {
                    const result = await response.json();
                    console.log('Background: Production API pairing code response:', result);
                    console.log('Background: Response keys:', Object.keys(result));
                    
                    // Check if the API response contains the expected pairingCode field
                    if (!result.pairingCode) {
                      console.error('Background: API response missing pairingCode field:', result);
                      throw new Error('API response missing pairingCode field. Response: ' + JSON.stringify(result));
                    }
                    
                    // Validate the returned pairing code format
                    const validation = this.validatePairingCode(result.pairingCode);
                    if (!validation.valid) {
                      console.error('Background: API returned invalid pairing code format:', result.pairingCode);
                      throw new Error(`API returned invalid format: ${result.pairingCode}. ${validation.error}`);
                    }
                    
                    console.log('Background: API returned valid pairing code:', result.pairingCode, 'format:', validation.format);
                    
                    // Store the pairing code in settings
                    if (!this.settings.pairingCodes) {
                      this.settings.pairingCodes = {};
                    }
                    this.settings.pairingCodes.current = {
                      code: result.pairingCode,
                      format: validation.format,
                      expiresAt: result.expiresAt,
                      generatedAt: new Date().toISOString()
                    };
                    this.settings.currentPairingCode = result.pairingCode;
                    await this.saveSettings();
                    
                    console.log('Background: Generated and stored pairing code from production API:', result.pairingCode);
                    sendResponse({ 
                      success: true, 
                      pairingCode: result.pairingCode,
                      format: validation.format,
                      expiresAt: result.expiresAt
                    });
                  } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                  }
                }
              } catch (error) {
                console.error('Background: Error getting current pairing code:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GET_NFT_DATA':
              try {
                const { nftUuid } = message;
                
                if (!nftUuid) {
                  throw new Error('NFT UUID is required');
                }
                
                console.log('Background: Retrieving NFT data for UUID:', nftUuid);
                const nftData = await this.retrieveNFTData(nftUuid);
                
                sendResponse({ 
                  success: true, 
                  nftData: nftData 
                });
              } catch (error) {
                console.error('Background: Error retrieving NFT data:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'CREATE_SELF_TRUST':
              try {
                // Use the registered device ID if available, otherwise generate a new one
                const deviceId = this.settings.deviceRegistration?.deviceId || this.generateDeviceId();
                const deviceInfo = this.settings.deviceRegistration?.deviceInfo || {
                  name: 'Chrome Extension',
                  type: 'chrome-extension',
                  version: chrome.runtime.getManifest().version
                };
                
                console.log('Background: Manually creating self-trust for device:', deviceId);
                console.log('Background: Device info:', deviceInfo);
                console.log('Background: Current settings trustedDevices:', this.settings.trustedDevices);
                
                const result = await this.createSelfTrust(deviceId, deviceInfo);
                console.log('Background: Self-trust creation result:', result);
                sendResponse({ success: true, result: result });
              } catch (error) {
                console.error('Background: Error creating self-trust:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GET_THOUGHT':
              if (sender.tab && sender.tab.id) {
                const thought = this.getThought(sender.tab.id);
                sendResponse({ thought: thought });
              } else {
                console.log('Background: GET_THOUGHT request from non-tab context (likely popup)');
                sendResponse({ thought: null });
              }
              break;

            case 'TYPING_ACTIVITY':
              if (sender.tab && sender.tab.id) {
                await this.handleTypingActivity(sender.tab.id, message.data);
                sendResponse({ success: true });
              } else {
                sendResponse({ error: 'No active tab found' });
              }
              break;

            case 'SHOW_NOTIFICATION':
              await this.showNotification(message.title, message.message);
              sendResponse({ success: true });
              break;

            case 'TOGGLE_SERVICE':
              this.typingServiceEnabled = !this.typingServiceEnabled;
              await this.broadcastToTabs({ type: 'SERVICE_TOGGLED', enabled: this.typingServiceEnabled });
              sendResponse({ enabled: this.typingServiceEnabled });
              break;

            case 'INPUT_DATA_CAPTURED':
              try {
                // Process and store input data
                await this.processInputData(message.data);
                sendResponse({ success: true });
              } catch (error) {
                console.error('Background: Error processing input data:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GET_INPUT_HISTORY':
              try {
                const inputHistory = await this.getInputHistory();
                sendResponse({ success: true, data: inputHistory });
              } catch (error) {
                console.error('Background: Error getting input history:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'CLEAR_INPUT_HISTORY':
              try {
                await this.clearInputHistory();
                sendResponse({ success: true });
              } catch (error) {
                console.error('Background: Error clearing input history:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'GET_SHARED_THOUGHTS':
              try {
                const sharedThoughts = await this.getSharedThoughts();
                sendResponse({ success: true, data: sharedThoughts });
              } catch (error) {
                console.error('Background: Error getting shared thoughts:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'CLEAR_SHARED_THOUGHTS':
              try {
                await this.clearSharedThoughts();
                sendResponse({ success: true });
              } catch (error) {
                console.error('Background: Error clearing shared thoughts:', error);
                sendResponse({ success: false, error: error.message });
              }
              break;

            case 'API_REQUEST':
              try {
                const { method, endpoint, data, requireAuth, deviceId, clientType, clientVersion, timestamp } = message;
                
                console.log('Background: Handling API request:', method, endpoint);
                
                // Prepare request options
                let url = `${this.backendURL}${endpoint}`;
                const options = {
                  method: method,
                  headers: {
                    'Content-Type': 'application/json'
                  }
                };

                // Add authentication header if required and available
                if (requireAuth && this.settings.authToken) {
                  options.headers['Authorization'] = `Bearer ${this.settings.authToken}`;
                }

                // Add request body for POST/PUT requests
                if (data && (method === 'POST' || method === 'PUT')) {
                  // Include device ID and metadata in the request body
                  const enrichedData = {
                    ...data,
                    _metadata: {
                      deviceId: deviceId,
                      clientType: clientType,
                      clientVersion: clientVersion,
                      timestamp: timestamp
                    }
                  };
                  options.body = JSON.stringify(enrichedData);
                } else if (method === 'GET' && (endpoint.includes('/devices/') || endpoint.includes('/trusted/'))) {
                  // For GET requests to device endpoints, append device ID as query parameter
                  const separator = endpoint.includes('?') ? '&' : '?';
                  url = url + `${separator}deviceId=${encodeURIComponent(deviceId)}`;
                }

                // Make the request
                const response = await fetch(url, options);
                const responseData = await response.json();

                // Handle authentication errors
                if (response.status === 401 && requireAuth) {
                  console.log('Background: Authentication failed, attempting token refresh...');
                  // TODO: Implement token refresh logic
                  throw new Error('Authentication failed');
                }

                // Handle server errors
                if (response.status >= 500) {
                  throw new Error(`Server error: ${response.status}`);
                }

                // Handle client errors
                if (response.status >= 400) {
                  throw new Error(`Client error: ${response.status} - ${responseData.message || 'Unknown error'}`);
                }

                sendResponse({ success: true, data: responseData });

              } catch (error) {
                console.error('Background: Error handling API request:', error);
                sendResponse({ error: error.message });
              }
              break;

            case 'DEVICE_MANAGER_REQUEST':
              try {
                const { method, endpoint, data, requireAuth, deviceId, deviceToken, clientType, clientVersion, timestamp } = message;
                
                console.log('Background: Handling device manager request:', method, endpoint);
                
                // Prepare request options
                let url = `${this.backendURL}${endpoint}`;
                const options = {
                  method: method,
                  headers: {
                    'Content-Type': 'application/json'
                  }
                };

                // Add device authentication header if available
                if (requireAuth && deviceToken) {
                  options.headers['Authorization'] = `Bearer ${deviceToken}`;
                }

                // Add request body for POST/PUT requests
                if (data && (method === 'POST' || method === 'PUT')) {
                  // Include device ID and metadata in the request body
                  const enrichedData = {
                    ...data,
                    _metadata: {
                       deviceId: deviceId,
                       clientType: clientType,
                       clientVersion: clientVersion,
                       timestamp: timestamp
                    }
                  };
                  options.body = JSON.stringify(enrichedData);
                } else if (method === 'GET' && (endpoint.includes('/devices/') || endpoint.includes('/trusted/'))) {
                  // For GET requests to device endpoints, append device ID as query parameter
                  const separator = endpoint.includes('?') ? '&' : '?';
                  url = url + `${separator}deviceId=${encodeURIComponent(deviceId)}`;
                }

                // Make the request
                const response = await fetch(url, options);
                const responseData = await response.json();

                // Handle authentication errors
                if (response.status === 401 && requireAuth) {
                  console.log('Background: Device authentication failed');
                  throw new Error('Device authentication failed');
                }

                // Handle server errors
                if (response.status >= 500) {
                  throw new Error(`Server error: ${response.status}`);
                }

                // Handle client errors
                if (response.status >= 400) {
                  throw new Error(`Client error: ${response.status} - ${responseData.message || 'Unknown error'}`);
                }

                sendResponse({ success: true, data: responseData });

              } catch (error) {
                console.error('Background: Error handling device manager request:', error);
                sendResponse({ error: error.message });
              }
              break;

            case 'PING':
              // Simple ping-pong for connection testing
              sendResponse({ pong: true, timestamp: Date.now() });
              break;

            case 'GET_PAIRING_CODE_STATUS':
              try {
                const { pairingCode, format } = message;
                console.log('Background: Getting pairing code status for:', pairingCode, 'format:', format);
                
                // Check if we have a current pairing code
                const currentPairingCodeData = this.settings.pairingCodes?.current;
                
                if (!currentPairingCodeData || !currentPairingCodeData.code) {
                  sendResponse({ 
                    success: false, 
                    error: 'No pairing code found',
                    pending: false 
                  });
                  return;
                }
                
                // Check if the requested pairing code matches our current one
                if (currentPairingCodeData.code !== pairingCode) {
                  sendResponse({ 
                    success: false, 
                    error: 'Pairing code mismatch',
                    pending: false 
                  });
                  return;
                }
                
                // For NFT format, just return the current status
                // The real fix is in the GENERATE_PAIRING_CODE handler
                if (currentPairingCodeData.nftStyle && format === 'nft') {
                  sendResponse({ 
                    success: true, 
                    pending: false,
                    pairingCode: currentPairingCodeData.code,
                    format: currentPairingCodeData.format,
                    expiresAt: currentPairingCodeData.expiresAt,
                    nftStyle: true
                  });
                } else {
                  // Non-NFT format, return current status
                  sendResponse({ 
                    success: true, 
                    pending: false,
                    pairingCode: currentPairingCodeData.code,
                    format: currentPairingCodeData.format,
                    expiresAt: currentPairingCodeData.expiresAt
                  });
                }
              } catch (error) {
                console.error('Background: Error getting pairing code status:', error);
                sendResponse({ 
                  success: false, 
                  error: error.message,
                  pending: false 
                });
              }
              break;

            default:
              console.log('Unknown message type:', message.type);
              sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error?.message || 'Unknown error occurred' });
    }
  }

  async handleCommand(command) {
    switch (command) {
      case 'toggle-typing-service':
        await this.toggleTypingService();
        break;
      case 'quick-settings':
        await this.openQuickSettings();
        break;
      case 'reset-thought-counter':
        await this.resetThoughtCounter();
        break;
    }
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'myl-zip-settings':
        await this.openSettings();
        break;
      case 'myl-zip-quick-settings':
        await this.openQuickSettings();
        break;
      case 'myl-zip-toggle-service':
        await this.toggleTypingService();
        break;
      case 'myl-zip-reset-counter':
        await this.resetThoughtCounter();
        break;
      case 'myl-zip-help':
        await this.openHelp();
        break;
    }
  }

  async saveThought(tabId, thought) {
    if (!thought || !thought.text) return;

    const thoughtData = {
      text: thought.text,
      timestamp: Date.now(),
      url: thought.url,
      title: thought.title,
      length: thought.text.length,
      wordCount: thought.text.trim().split(/\s+/).filter(word => word.length > 0).length
    };

    this.thoughtData.set(tabId, thoughtData);
    await this.saveThoughtData();

    // Update badge with thought length
    this.updateBadge(tabId, thoughtData.length);
  }

  getThought(tabId) {
    return this.thoughtData.get(tabId) || null;
  }

  async saveCurrentThought(tabId) {
    try {
      // Check if tab still exists before sending message
      await chrome.tabs.get(tabId);
      const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_CURRENT_THOUGHT' });
      if (response && response.thought) {
        await this.saveThought(tabId, response.thought);
      }
    } catch (error) {
      // Tab might not exist, have content script, or be accessible
      if (error.message.includes('No tab with id')) {
        // Remove invalid tab from activeTabs
        this.activeTabs.delete(tabId);
        console.log('Removed invalid tab from activeTabs during saveCurrentThought:', tabId);
      } else {
        console.log('Could not get current thought for tab:', tabId, error.message);
      }
    }
  }

  async loadThoughtForTab(tabId) {
    const thought = this.getThought(tabId);
    if (thought) {
      try {
        // Check if tab still exists before sending message
        await chrome.tabs.get(tabId);
        await chrome.tabs.sendMessage(tabId, { 
          type: 'LOAD_THOUGHT', 
          thought: thought 
        });
      } catch (error) {
        if (error.message.includes('No tab with id')) {
          // Remove invalid tab from activeTabs
          this.activeTabs.delete(tabId);
          console.log('Removed invalid tab from activeTabs during loadThoughtForTab:', tabId);
        } else {
          console.log('Could not load thought for tab:', tabId, error.message);
        }
      }
    }
  }

  updateBadge(tabId, thoughtLength = 0) {
    let badgeText = '';
    let badgeColor = '#4CAF50'; // Green

    if (thoughtLength > 0) {
      if (thoughtLength < 100) {
        badgeText = '●';
        badgeColor = '#4CAF50'; // Green
      } else if (thoughtLength < 500) {
        badgeText = '●●';
        badgeColor = '#FF9800'; // Orange
      } else {
        badgeText = '●●●';
        badgeColor = '#F44336'; // Red
      }
    }

    chrome.action.setBadgeText({ text: badgeText, tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tabId });
  }

  async handleTypingActivity(tabId, data) {
    if (!this.typingServiceEnabled) return;

    // Process typing activity and trigger responses if needed
    const analysis = this.analyzeTypingActivity(data);
    
    if (analysis.needsAttention) {
      await this.triggerAttentionResponse(tabId, analysis);
    }
  }

  analyzeTypingActivity(data) {
    const text = data.text.toLowerCase();
    const hasTriggerKeywords = this.settings.responseTriggerKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );

    const needsAttention = hasTriggerKeywords || 
      data.wordCount > 20 || 
      data.characterCount > 100 ||
      text.includes('?') ||
      text.includes('!');

    return {
      hasTriggerKeywords,
      needsAttention,
      confidence: hasTriggerKeywords ? 0.8 : 0.6,
      context: hasTriggerKeywords ? 'keyword-trigger' : 'long-text'
    };
  }

  async triggerAttentionResponse(tabId, analysis) {
    try {
      // Check if tab still exists before sending message
      await chrome.tabs.get(tabId);
      await chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_ATTENTION_OVERLAY',
        analysis: analysis
      });
    } catch (error) {
      if (error.message.includes('No tab with id')) {
        // Remove invalid tab from activeTabs
        this.activeTabs.delete(tabId);
        console.log('Removed invalid tab from activeTabs during triggerAttentionResponse:', tabId);
      } else {
        console.log('Could not show attention overlay for tab:', tabId, error.message);
      }
    }
  }

  async showNotification(title, message) {
    if (this.settings.enableSoundFeedback) {
      // Play notification sound
      this.playNotificationSound();
    }

    // Show browser notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  }

  playNotificationSound() {
    // Create audio context for notification sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(this.settings.soundVolume / 100 * 0.1, audioContext.currentTime);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  async toggleTypingService() {
    this.typingServiceEnabled = !this.typingServiceEnabled;
    this.settings.enableTypingAwareService = this.typingServiceEnabled;
    await this.saveSettings();
    
    await this.broadcastToTabs({ 
      type: 'SERVICE_TOGGLED', 
      enabled: this.typingServiceEnabled 
    });

    await this.showNotification(
      'Myl.Zip Service',
      `Typing-Aware Service ${this.typingServiceEnabled ? 'enabled' : 'disabled'}`
    );
  }

  async openSettings() {
    // Open settings page
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  }

  async openQuickSettings() {
    // Open popup for quick settings
    chrome.action.openPopup();
  }

  async resetThoughtCounter() {
    this.thoughtData.clear();
    await this.saveThoughtData();
    
    // Reset badges for all tabs
    for (const tabId of this.activeTabs) {
      this.updateBadge(tabId, 0);
    }

    await this.showNotification('Myl.Zip', 'Thought counter reset');
  }

  async openHelp() {
    chrome.tabs.create({ url: 'https://github.com/XDM-ZSBW/zip-myl-chromium#readme' });
  }

  async broadcastToTabs(message) {
    // Create a copy of activeTabs to avoid modification during iteration
    const tabsToProcess = Array.from(this.activeTabs);
    
    for (const tabId of tabsToProcess) {
      try {
        // Check if tab still exists before sending message
        const tab = await chrome.tabs.get(tabId);
        if (tab) {
          await chrome.tabs.sendMessage(tabId, message);
        } else {
          // Tab no longer exists, remove from activeTabs
          this.activeTabs.delete(tabId);
        }
      } catch (error) {
        // Tab doesn't exist or other error, remove from activeTabs
        this.activeTabs.delete(tabId);
        if (error.message.includes('No tab with id')) {
          console.log('Removed invalid tab from activeTabs:', tabId);
        } else {
          console.log('Error sending message to tab:', tabId, error.message);
        }
      }
    }
  }

  async cleanupOldThoughts() {
    const now = Date.now();
    const maxAge = this.settings.thoughtPersistenceDuration;
    
    for (const [tabId, thought] of this.thoughtData.entries()) {
      if (now - thought.timestamp > maxAge) {
        this.thoughtData.delete(tabId);
      }
    }
    
    await this.saveThoughtData();
  }

  async syncWithMylZip() {
    if (!this.settings.enableMylZipSync || !this.settings.mylZipEndpoint) {
      return;
    }

    try {
      const thoughts = Array.from(this.thoughtData.values());
      const response = await fetch(this.settings.mylZipEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thoughts: thoughts,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        console.log('Successfully synced with Myl.Zip');
      }
    } catch (error) {
      console.error('Error syncing with Myl.Zip:', error);
    }
  }

  async handleStorageChange(changes, namespace) {
    if (namespace === 'sync' && changes.mylZipSettings) {
      this.settings = changes.mylZipSettings.newValue;
      await this.broadcastToTabs({ 
        type: 'SETTINGS_UPDATED', 
        settings: this.settings 
      });
    }
  }

  /**
   * Process input data captured from content scripts
   */
  async processInputData(inputData) {
    try {
      console.log('Background: Processing input data:', inputData);
      
      // Store in background script's input history
      if (!this.inputHistory) {
        this.inputHistory = [];
      }
      
      this.inputHistory.push(inputData);
      
      // Keep only last 500 entries in memory
      if (this.inputHistory.length > 500) {
        this.inputHistory.splice(0, this.inputHistory.length - 500);
      }
      
      // Store in Chrome storage for persistence
      await this.storeInputDataInStorage(inputData);
      
      // Send to backend if available
      if (this.apiClient) {
        await this.sendInputDataToBackend(inputData);
      }
      
    } catch (error) {
      console.error('Background: Error processing input data:', error);
      throw error;
    }
  }

  /**
   * Store input data in Chrome storage
   */
  async storeInputDataInStorage(inputData) {
    try {
      const result = await chrome.storage.local.get(['mylZipInputHistory']);
      const existingData = result.mylZipInputHistory || [];
      
      existingData.push(inputData);
      
      // Keep only last 2000 entries to prevent storage bloat
      if (existingData.length > 2000) {
        existingData.splice(0, existingData.length - 2000);
      }
      
      await chrome.storage.local.set({ mylZipInputHistory: existingData });
      
    } catch (error) {
      console.error('Background: Error storing input data:', error);
    }
  }

  /**
   * Send input data to backend
   */
  async sendInputDataToBackend(inputData) {
    try {
      if (!this.apiClient) return;
      
      // Skip sending sensitive data to backend
      if (inputData.isSensitive || inputData.isExcluded) {
        console.log('Background: Skipping backend sync for sensitive data:', {
          classification: inputData.dataClassification,
          isSensitive: inputData.isSensitive,
          isExcluded: inputData.isExcluded
        });
        return;
      }
      
      // Only send non-sensitive data to backend
      const sanitizedData = {
        ...inputData,
        source: 'comprehensive-input-tracking',
        // Remove sensitive fields
        inputValue: inputData.dataClassification?.level === 'confidential' ? '[REDACTED]' : inputData.inputValue
      };
      
      // Send to backend API
      const result = await this.apiClient.saveThought(
        sanitizedData.inputValue, 
        sanitizedData
      );
      
      if (result && result.success) {
        console.log('Background: Input data sent to backend successfully');
      }
      
    } catch (error) {
      console.error('Background: Error sending input data to backend:', error);
    }
  }

  /**
   * Get input history for data viewer
   */
  async getInputHistory() {
    try {
      const result = await chrome.storage.local.get(['mylZipInputHistory']);
      return result.mylZipInputHistory || [];
    } catch (error) {
      console.error('Background: Error getting input history:', error);
      return [];
    }
  }

  /**
   * Clear input history
   */
  async clearInputHistory() {
    try {
      await chrome.storage.local.remove(['mylZipInputHistory']);
      this.inputHistory = [];
      console.log('Background: Input history cleared');
    } catch (error) {
      console.error('Background: Error clearing input history:', error);
    }
  }

  /**
   * Get shared thoughts from other devices
   */
  async getSharedThoughts() {
    try {
      const result = await chrome.storage.local.get(['mylZipSharedThoughts']);
      return result.mylZipSharedThoughts || [];
    } catch (error) {
      console.error('Background: Error getting shared thoughts:', error);
      return [];
    }
  }

  /**
   * Clear shared thoughts
   */
  async clearSharedThoughts() {
    try {
      await chrome.storage.local.remove(['mylZipSharedThoughts']);
      console.log('Background: Shared thoughts cleared');
    } catch (error) {
      console.error('Background: Error clearing shared thoughts:', error);
    }
  }

  /**
   * Handle trust network messages
   */
  async handleTrustNetworkMessage(message, sender, sendResponse) {
    try {
      if (!this.trustNetworkService) {
        await this.initializeTrustNetworkService();
      }

      switch (message.type) {
        case 'GET_TRUSTED_DOMAINS':
          const domains = this.trustNetworkService.getTrustedDomains();
          sendResponse(domains);
          break;

        case 'ADD_TRUSTED_DOMAIN':
          const addResult = await this.trustNetworkService.addTrustedDomain(message.domain, message.config);
          sendResponse({ success: addResult });
          break;

        case 'REMOVE_TRUSTED_DOMAIN':
          const removeResult = await this.trustNetworkService.removeTrustedDomain(message.domain);
          sendResponse({ success: removeResult });
          break;

        case 'UPDATE_TRUSTED_DOMAIN':
          const updateResult = await this.trustNetworkService.updateTrustedDomain(message.domain, message.updates);
          sendResponse({ success: updateResult });
          break;

        case 'GET_TRUST_NETWORK_STATS':
          const stats = this.trustNetworkService.getTrustNetworkStats();
          sendResponse(stats);
          break;

        case 'EXPORT_TRUST_NETWORK':
          const exportData = this.trustNetworkService.exportTrustNetwork();
          sendResponse(exportData);
          break;

        case 'IMPORT_TRUST_NETWORK':
          const importResult = await this.trustNetworkService.importTrustNetwork(message.config);
          sendResponse({ success: importResult });
          break;

        case 'VERIFY_TRUST_LEVELS':
          await this.trustNetworkService.verifyTrustLevels();
          sendResponse({ success: true });
          break;

        // New authentication-related messages
        case 'GET_AUTH_STATUS':
          const authStatus = this.trustNetworkService.getAuthenticationStatus();
          sendResponse(authStatus);
          break;

        case 'AUTHENTICATE_DEVICE':
          const authResult = await this.trustNetworkService.authenticateDevice(message.deviceId, message.operatorCredentials);
          sendResponse({ success: authResult });
          break;

        case 'DEAUTHENTICATE_DEVICE':
          const deauthResult = await this.trustNetworkService.deauthenticateDevice();
          sendResponse({ success: deauthResult });
          break;

        case 'GET_BACKEND_SITES':
          const backendSites = this.trustNetworkService.backendConfiguredSites ? 
            Array.from(this.trustNetworkService.backendConfiguredSites.values()) : [];
          sendResponse(backendSites);
          break;

        case 'GET_ENHANCED_STATUS':
          const enhancedStatus = this.trustNetworkService.getEnhancedExperienceStatus(message.domain);
          sendResponse(enhancedStatus);
          break;

        default:
          sendResponse({ error: 'Unknown trust network message type' });
      }
    } catch (error) {
      console.error('Background: Trust network message handling failed:', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Generate a local UUID for fallback NFT pairing codes
   * @returns {string} A locally generated UUID
   */
  generateLocalUUID() {
    // Generate a UUID v4-like identifier for local use
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 15);
    const deviceId = this.settings?.deviceRegistration?.deviceInfo?.id || 'unknown';
    
    // Create a unique identifier that combines timestamp, random data, and device info
    const uuid = `local_${timestamp}_${randomPart}_${deviceId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    console.log('Background: Generated local UUID:', uuid);
    return uuid;
  }
}

// Initialize the background service
const mylZipBackground = new MylZipBackground();
