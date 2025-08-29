// Myl.Zip Chromium Extension - Popup Script
// Handles popup interactions and displays current state

class MylZipPopup {
  constructor() {
    this.settings = null;
    this.currentThought = null;
    this.typingCount = 0;
    this.sessionStartTime = Date.now();
    this.thoughtCount = 0;
    this.setupStatus = {
      backend: 'unknown',
      security: 'unknown',
      device: 'unknown',
      pairing: 'unknown'
    };
    
    this.init();
  }

  async init() {
    console.log('Myl.Zip Popup: Initializing...');
    
    // Load settings and current state with retry
    await this.loadSettingsWithRetry();
    await this.loadCurrentState();
    await this.loadSetupStatus();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update UI based on setup status
    this.updateUI();
    this.updateSetupProgress();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    console.log('Myl.Zip Popup: Ready');
  }

  async loadSetupStatus() {
    try {
      // Check backend connection
      await this.checkBackendStatus();
      
      // Check security setup
      await this.checkSecurityStatus();
      
      // Check device registration
      await this.checkDeviceStatus();
      
      // Check pairing status
      await this.checkPairingStatus();
      
    } catch (error) {
      console.error('Popup: Error loading setup status:', error);
    }
  }

  async checkBackendStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_BACKEND_STATUS' });
      if (response && response.connected) {
        this.setupStatus.backend = 'connected';
        this.updateStatusDisplay('backendStatus', 'Connected', 'success');
      } else {
        this.setupStatus.backend = 'disconnected';
        this.updateStatusDisplay('backendStatus', 'Disconnected', 'error');
      }
    } catch (error) {
      this.setupStatus.backend = 'error';
      this.updateStatusDisplay('backendStatus', 'Error', 'error');
    }
  }

  async checkSecurityStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_ENCRYPTION_STATUS' });
      if (response && response.encrypted) {
        this.setupStatus.security = 'enabled';
        this.updateStatusDisplay('securityStatus', 'Enabled', 'success');
      } else {
        this.setupStatus.security = 'disabled';
        this.updateStatusDisplay('securityStatus', 'Disabled', 'warning');
      }
    } catch (error) {
      this.setupStatus.security = 'error';
      this.updateStatusDisplay('securityStatus', 'Error', 'error');
    }
  }

  async checkDeviceStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_DEVICE_STATUS' });
      if (response && response.registered) {
        this.setupStatus.device = 'registered';
        this.updateStatusDisplay('deviceStatus', 'Registered', 'success');
      } else {
        this.setupStatus.device = 'unregistered';
        this.updateStatusDisplay('deviceStatus', 'Not Registered', 'warning');
      }
    } catch (error) {
      this.setupStatus.device = 'error';
      this.updateStatusDisplay('deviceStatus', 'Error', 'error');
    }
  }

  async checkPairingStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_PAIRING_STATUS' });
      if (response && response.paired) {
        this.setupStatus.pairing = 'paired';
        this.updateStatusDisplay('deviceStatus', 'Paired', 'success');
      } else {
        this.setupStatus.pairing = 'unpaired';
        this.updateStatusDisplay('deviceStatus', 'Not Paired', 'info');
      }
    } catch (error) {
      this.setupStatus.pairing = 'error';
      this.updateStatusDisplay('deviceStatus', 'Error', 'error');
    }
  }

  async loadConnectionStatus() {
    try {
      // Check backend connection status
      await this.checkBackendStatus();
      
      // Check if we have a valid backend URL
      const settings = await chrome.storage.local.get(['mylZipBackendURL']);
      if (settings.mylZipBackendURL) {
        this.setupStatus.backendUrl = settings.mylZipBackendURL;
      }
      
      // Update connection display
      this.updateConnectionDisplay();
    } catch (error) {
      console.error('Popup: Error loading connection status:', error);
      this.setupStatus.backend = 'error';
      this.updateStatusDisplay('backendStatus', 'Error', 'error');
    }
  }

  updateConnectionDisplay() {
    // Update connection status display elements
    const connectionElement = document.getElementById('connectionStatus');
    if (connectionElement) {
      const status = this.setupStatus.backend;
      const url = this.setupStatus.backendUrl || 'Not configured';
      
      if (status === 'connected') {
        connectionElement.innerHTML = `<span class="status-success">Connected to ${url}</span>`;
      } else if (status === 'disconnected') {
        connectionElement.innerHTML = `<span class="status-error">Disconnected from ${url}</span>`;
      } else {
        connectionElement.innerHTML = `<span class="status-warning">Status: ${status}</span>`;
      }
    }
  }

  async loadEncryptionStatus() {
    try {
      // Check encryption status
      await this.checkSecurityStatus();
      
      // Get encryption settings from storage
      const settings = await chrome.storage.local.get(['mylZipEncryptionSetup']);
      if (settings.mylZipEncryptionSetup) {
        this.setupStatus.encryption = settings.mylZipEncryptionSetup;
      }
      
      // Update encryption display
      this.updateEncryptionDisplay();
    } catch (error) {
      console.error('Popup: Error loading encryption status:', error);
      this.setupStatus.security = 'error';
      this.updateStatusDisplay('securityStatus', 'Error', 'error');
    }
  }

  updateEncryptionDisplay() {
    // Update encryption status display elements
    const encryptionElement = document.getElementById('encryptionStatus');
    if (encryptionElement) {
      const status = this.setupStatus.security;
      const setup = this.setupStatus.encryption;
      
      if (status === 'enabled' && setup && setup.isSetup) {
        encryptionElement.innerHTML = `<span class="status-success">Encrypted (${setup.setupDate ? new Date(setup.setupDate).toLocaleDateString() : 'Unknown'})</span>`;
      } else if (status === 'disabled') {
        encryptionElement.innerHTML = `<span class="status-warning">Not Encrypted</span>`;
      } else {
        encryptionElement.innerHTML = `<span class="status-error">Status: ${status}</span>`;
      }
    }
  }

  updateStatusDisplay(elementId, text, status) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
      element.className = `status-${status}`;
    }
  }

  updateSetupProgress() {
    let currentStep = 1;
    
    // Determine current step based on setup status
    if (this.setupStatus.backend === 'connected') {
      currentStep = 2;
      if (this.setupStatus.security === 'enabled') {
        currentStep = 3;
        if (this.setupStatus.device === 'registered') {
          currentStep = 4;
          if (this.setupStatus.pairing === 'paired') {
            currentStep = 5; // Complete
          }
        }
      }
    }

    // Update progress indicators
    this.updateProgressSteps(currentStep);
    
    // Show appropriate action section
    this.showActionSection(currentStep);
  }

  updateProgressSteps(currentStep) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active');
      
      if (stepNum < currentStep) {
        step.classList.add('completed');
      } else if (stepNum === currentStep) {
        step.classList.add('active');
      }
    });
  }

  showActionSection(step) {
    // Hide all action sections
    const actionSections = document.querySelectorAll('.action-step');
    actionSections.forEach(section => {
      section.classList.add('hidden');
    });

    // Show appropriate section
    let targetSection;
    if (step === 1) {
      targetSection = 'step1Actions';
    } else if (step === 2) {
      targetSection = 'step2Actions';
    } else if (step === 3) {
      targetSection = 'step3Actions';
    } else if (step === 4) {
      targetSection = 'step4Actions';
    } else {
      targetSection = 'completeActions';
    }

    const section = document.getElementById(targetSection);
    if (section) {
      section.classList.remove('hidden');
    }
  }

  async loadSettingsWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.loadSettings();
        return; // Success, exit retry loop
      } catch (error) {
        console.log(`Settings load attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          console.error('All settings load attempts failed, using defaults');
          this.settings = this.getDefaultSettings();
          this.showError('Could not connect to background service. Using default settings.');
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        }
      }
    }
  }

  async loadSettings() {
    try {
      console.log('Popup: Attempting to connect to background script...');
      
      // Add a small delay to ensure background script is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      console.log('Popup: Received response from background:', response);
      
      if (response && response.settings) {
        this.settings = response.settings;
        console.log('Popup: Settings loaded successfully:', this.settings);
      } else {
        throw new Error('No settings received from background script');
      }
    } catch (error) {
      console.error('Popup: Error loading settings:', error);
      this.settings = this.getDefaultSettings();
      
      // Show user-friendly error message
      this.showError('Could not connect to background service. Using default settings.');
    }
  }

  async loadCurrentState() {
    try {
      // Get current tab info first
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.currentTabId = tab.id;
        
        // Try to get data directly from content script first
        try {
          const thoughtResponse = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_THOUGHT' });
          if (thoughtResponse && thoughtResponse.thought !== undefined) {
            this.currentThought = thoughtResponse.thought;
          }
          
          const statsResponse = await chrome.tabs.sendMessage(tab.id, { type: 'GET_TYPING_STATS' });
          if (statsResponse) {
            this.typingCount = statsResponse.typingCount || 0;
            this.thoughtCount = statsResponse.thoughtCount || 0;
          }
        } catch (contentScriptError) {
          console.log('Could not get data from content script, trying background script:', contentScriptError);
          
          // Fallback to background script
          const thoughtResponse = await chrome.runtime.sendMessage({ type: 'GET_THOUGHT' });
          if (thoughtResponse && thoughtResponse.thought !== undefined) {
            this.currentThought = thoughtResponse.thought;
          }
          
          const statsResponse = await chrome.runtime.sendMessage({ type: 'GET_TYPING_STATS' });
          if (statsResponse) {
            this.typingCount = statsResponse.typingCount || 0;
            this.thoughtCount = statsResponse.thoughtCount || 0;
          }
        }
      }
      
    } catch (error) {
      console.error('Popup: Error loading current state:', error);
    }
  }

  setupEventListeners() {
    // Setup wizard button
    const setupWizardBtn = document.getElementById('setupWizard');
    if (setupWizardBtn) {
      setupWizardBtn.addEventListener('click', () => this.openSetupWizard());
    }

    // Quick start button
    const quickStartBtn = document.getElementById('quickStart');
    if (quickStartBtn) {
      quickStartBtn.addEventListener('click', () => this.quickStart());
    }

    // Test connection button
    const testConnectionBtn = document.getElementById('testConnection');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => this.testConnection());
    }

    // Configure backend button
    const configureBackendBtn = document.getElementById('configureBackend');
    if (configureBackendBtn) {
      configureBackendBtn.addEventListener('click', () => this.openSettings());
    }

    // Setup encryption button
    const setupEncryptionBtn = document.getElementById('setupEncryption');
    if (setupEncryptionBtn) {
      setupEncryptionBtn.addEventListener('click', () => this.setupEncryption());
    }

    // Register device button
    const registerDeviceBtn = document.getElementById('registerDevice');
    if (registerDeviceBtn) {
      registerDeviceBtn.addEventListener('click', () => this.registerDevice());
    }

    // Pair device button
    const pairDeviceBtn = document.getElementById('pairDevice');
    if (pairDeviceBtn) {
      pairDeviceBtn.addEventListener('click', () => this.openPairing());
    }

    // Manage devices button
    const manageDevicesBtn = document.getElementById('manageDevices');
    if (manageDevicesBtn) {
      manageDevicesBtn.addEventListener('click', () => this.manageDevices());
    }

    // Start using button
    const startUsingBtn = document.getElementById('startUsing');
    if (startUsingBtn) {
      startUsingBtn.addEventListener('click', () => this.startUsing());
    }

    // Open thoughts button
    const openThoughtsBtn = document.getElementById('openThoughts');
    if (openThoughtsBtn) {
      openThoughtsBtn.addEventListener('click', () => this.openThoughts());
    }

    // Quick access buttons
    const openSettingsBtn = document.getElementById('openSettings');
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => this.openSettings());
    }

    const openInputHistoryBtn = document.getElementById('openInputHistory');
    if (openInputHistoryBtn) {
      openInputHistoryBtn.addEventListener('click', () => this.openInputHistory());
    }

    const toggleServiceBtn = document.getElementById('toggleService');
    if (toggleServiceBtn) {
      toggleServiceBtn.addEventListener('click', () => this.toggleService());
    }

    const openTrustNetworkBtn = document.getElementById('openTrustNetwork');
    if (openTrustNetworkBtn) {
      openTrustNetworkBtn.addEventListener('click', () => this.openTrustNetwork());
    }

    // Help and about links
    const helpLink = document.getElementById('helpLink');
    if (helpLink) {
      helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showHelp();
      });
    }

    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink) {
      aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showAbout();
      });
    }
  }

  updateUI() {
    this.updateServiceStatus();
    this.updateCurrentThought();
    this.updateStats();
    this.updateQuickSettings();
  }

  showError(message) {
    // Create or update error message display
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'error-message';
      errorElement.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorElement && errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    }, 5000);
  }

  updateConnectionStatus(status, text) {
    const connectionStatus = document.getElementById('connectionStatus');
    const connectionIndicator = document.getElementById('connectionIndicator');
    const connectionText = document.getElementById('connectionText');
    
    if (connectionStatus && connectionIndicator && connectionText) {
      // Show/hide connection status
      if (status === 'connected') {
        connectionStatus.classList.add('hidden'); // Hide when connected
      } else {
        connectionStatus.classList.remove('hidden');
      }
      
      // Update indicator
      connectionIndicator.className = `connection-indicator ${status}`;
      connectionText.textContent = text;
    }
  }

  async testConnection() {
    try {
      this.showLoading('Testing connection...');
      
      const response = await chrome.runtime.sendMessage({ type: 'TEST_BACKEND_CONNECTION' });
      
      this.hideLoading();
      
      if (response && response.success) {
        this.showSuccess('Connection successful!');
        await this.loadSetupStatus();
        this.updateSetupProgress();
      } else {
        this.showError('Connection failed: ' + (response?.message || 'Unknown error'));
      }
      
    } catch (error) {
      this.hideLoading();
      this.showError('Connection test failed: ' + error.message);
    }
  }

  updateServiceStatus(isActive) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const toggleServiceBtn = document.getElementById('toggleService');

    if (isActive) {
      if (statusIndicator) {
        statusIndicator.classList.remove('inactive');
      }
      if (statusText) {
        statusText.textContent = 'Active';
      }
      if (toggleServiceBtn) {
        toggleServiceBtn.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">Pause Service</span>';
      }
    } else {
      if (statusIndicator) {
        statusIndicator.classList.add('inactive');
      }
      if (statusText) {
        statusText.textContent = 'Inactive';
      }
      if (toggleServiceBtn) {
        toggleServiceBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Start Service</span>';
      }
    }
  }

  updateCurrentThought() {
    const thoughtContent = document.getElementById('thoughtContent');
    const thoughtLength = document.querySelector('.thought-length');
    const thoughtWords = document.querySelector('.thought-words');

    if (this.currentThought && this.currentThought.text) {
      const text = this.currentThought.text;
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      if (thoughtContent) {
        thoughtContent.textContent = text.length > 100 ? text.substring(0, 100) + '...' : text;
      }
      if (thoughtLength) {
        thoughtLength.textContent = `${text.length} chars`;
      }
      if (thoughtWords) {
        thoughtWords.textContent = `${words} words`;
      }
    } else {
      if (thoughtContent) {
        thoughtContent.textContent = 'No active thought';
      }
      if (thoughtLength) {
        thoughtLength.textContent = '0 chars';
      }
      if (thoughtWords) {
        thoughtWords.textContent = '0 words';
      }
    }
  }

  updateStats() {
    const typingCountEl = document.getElementById('typingCount');
    const sessionTimeEl = document.getElementById('sessionTime');
    const thoughtCountEl = document.getElementById('thoughtCount');

    // Update typing count (this would come from background script in a real implementation)
    if (typingCountEl) {
      typingCountEl.textContent = this.typingCount.toString();
    }

    // Update session time
    if (sessionTimeEl) {
      const sessionMinutes = Math.floor((Date.now() - this.sessionStartTime) / 60000);
      sessionTimeEl.textContent = `${sessionMinutes}m`;
    }

    // Update thought count (this would come from background script in a real implementation)
    if (thoughtCountEl) {
      thoughtCountEl.textContent = this.thoughtCount.toString();
    }
  }

  updateQuickSettings() {
    if (!this.settings) return;

    const typingServiceToggle = document.getElementById('typingServiceToggle');
    const visualFeedbackToggle = document.getElementById('visualFeedbackToggle');
    const soundFeedbackToggle = document.getElementById('soundFeedbackToggle');
    const runOnDetectionToggle = document.getElementById('runOnDetectionToggle');

    if (typingServiceToggle) {
      typingServiceToggle.checked = this.settings.enableTypingAwareService;
    }
    if (visualFeedbackToggle) {
      visualFeedbackToggle.checked = this.settings.enableVisualFeedback;
    }
    if (soundFeedbackToggle) {
      soundFeedbackToggle.checked = this.settings.enableSoundFeedback;
    }
    if (runOnDetectionToggle) {
      runOnDetectionToggle.checked = this.settings.enableRunOnThoughtDetection;
    }
  }

  async toggleService() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_SERVICE' });
      
      if (response && response.success) {
        const isActive = response.isActive;
        this.updateServiceStatus(isActive);
        
        if (isActive) {
          this.showSuccess('Service activated');
        } else {
          this.showSuccess('Service deactivated');
        }
      }
      
    } catch (error) {
      this.showError('Failed to toggle service: ' + error.message);
    }
  }

  async updateSetting(settingName, value) {
    try {
      const updatedSettings = { [settingName]: value };
      await chrome.runtime.sendMessage({ 
        type: 'UPDATE_SETTINGS', 
        settings: updatedSettings 
      });
      
      this.settings[settingName] = value;
      this.updateServiceStatus();
      
      console.log(`Setting ${settingName} updated to:`, value);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  }

  openThoughts() {
    chrome.tabs.create({ url: 'thoughts.html' });
  }

  openSettings() {
    chrome.tabs.create({ url: 'settings.html' });
  }

  async openBackendSettings() {
    try {
      await chrome.runtime.sendMessage({ type: 'SHOW_NOTIFICATION', title: 'Myl.Zip', message: 'Opening backend settings...' });
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('Error opening backend settings:', error);
    }
  }

  openInputHistory() {
    chrome.tabs.create({ url: 'input-history.html' });
  }

  async openNFTPairing() {
    try {
      await chrome.runtime.sendMessage({ type: 'SHOW_NOTIFICATION', title: 'Myl.Zip', message: 'Opening NFT pairing...' });
      chrome.tabs.create({ url: chrome.runtime.getURL('nft-pairing.html') });
    } catch (error) {
      console.error('Error opening NFT pairing:', error);
    }
  }

  async resetCounter() {
    try {
      await chrome.runtime.sendMessage({ type: 'SHOW_NOTIFICATION', title: 'Myl.Zip', message: 'Resetting counter...' });
      this.typingCount = 0;
      this.thoughtCount = 0;
      this.currentThought = null;
      this.updateStats();
      this.updateCurrentThought();
    } catch (error) {
      console.error('Error resetting counter:', error);
    }
  }

  openHelp() {
    chrome.tabs.create({ url: 'https://github.com/XDM-ZSBW/zip-myl-chromium#readme' });
  }

  openAbout() {
    chrome.tabs.create({ url: 'https://github.com/XDM-ZSBW/zip-myl-chromium' });
  }

  startPeriodicUpdates() {
    // Update stats every 5 seconds
    setInterval(() => {
      this.updateStats();
    }, 5000);

    // Update current thought every 2 seconds
    setInterval(async () => {
      await this.loadCurrentState();
      await this.loadConnectionStatus();
      await this.loadEncryptionStatus();
      this.updateCurrentThought();
    }, 2000);
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'SERVICE_TOGGLED':
        this.settings.enableTypingAwareService = message.enabled;
        this.updateServiceStatus();
        this.updateQuickSettings();
        break;
      
      case 'SETTINGS_UPDATED':
        this.settings = { ...this.settings, ...message.settings };
        this.updateQuickSettings();
        this.updateServiceStatus();
        break;
      
      case 'THOUGHT_UPDATED':
        this.currentThought = message.thought;
        this.updateCurrentThought();
        break;
      
      case 'STATS_UPDATED':
        this.typingCount = message.typingCount || this.typingCount;
        this.thoughtCount = message.thoughtCount || this.thoughtCount;
        this.updateStats();
        break;
    }
  }

  // Action methods
  openSetupWizard() {
    chrome.tabs.create({ url: 'setup-wizard.html' });
  }

  async quickStart() {
    try {
      this.showLoading('Setting up Myl.Zip...');
      
      // Auto-configure with defaults
      await this.autoConfigure();
      
      this.hideLoading();
      this.showSuccess('Quick setup complete! Myl.Zip is ready to use.');
      
      // Refresh status
      await this.loadSetupStatus();
      this.updateSetupProgress();
      
    } catch (error) {
      this.hideLoading();
      this.showError('Quick setup failed: ' + error.message);
    }
  }

  async autoConfigure() {
    // Auto-configure backend
    await this.autoConfigureBackend();
    
    // Auto-setup encryption
    await this.autoSetupEncryption();
    
    // Auto-register device
    await this.autoRegisterDevice();
  }

  async autoConfigureBackend() {
    // Use default backend URL
    const defaultBackend = 'https://api.myl.zip';
    
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_BACKEND_URL',
        url: defaultBackend
      });
      
      // Test connection
      await this.testConnection();
      
    } catch (error) {
      console.error('Auto backend config failed:', error);
    }
  }

  async autoSetupEncryption() {
    try {
      await chrome.runtime.sendMessage({ type: 'SETUP_ENCRYPTION' });
    } catch (error) {
      console.error('Auto encryption setup failed:', error);
    }
  }

  async autoRegisterDevice() {
    try {
      await chrome.runtime.sendMessage({ type: 'REGISTER_DEVICE' });
    } catch (error) {
      console.error('Auto device registration failed:', error);
    }
  }

  async testConnection() {
    try {
      this.showLoading('Testing connection...');
      
      const response = await chrome.runtime.sendMessage({ type: 'TEST_BACKEND_CONNECTION' });
      
      this.hideLoading();
      
      if (response && response.success) {
        this.showSuccess('Connection successful!');
        await this.loadSetupStatus();
        this.updateSetupProgress();
      } else {
        this.showError('Connection failed: ' + (response?.message || 'Unknown error'));
      }
      
    } catch (error) {
      this.hideLoading();
      this.showError('Connection test failed: ' + error.message);
    }
  }

  openSettings() {
    chrome.tabs.create({ url: 'settings.html' });
  }

  async setupEncryption() {
    try {
      this.showLoading('Setting up encryption...');
      
      const response = await chrome.runtime.sendMessage({ type: 'SETUP_ENCRYPTION' });
      
      this.hideLoading();
      
      if (response && response.success) {
        this.showSuccess('Encryption setup complete!');
        await this.loadSetupStatus();
        this.updateSetupProgress();
      } else {
        this.showError('Encryption setup failed: ' + (response?.message || 'Unknown error'));
      }
      
    } catch (error) {
      this.hideLoading();
      this.showError('Encryption setup failed: ' + error.message);
    }
  }

  async registerDevice() {
    try {
      this.showLoading('Registering device...');
      
      const response = await chrome.runtime.sendMessage({ type: 'REGISTER_DEVICE' });
      
      this.hideLoading();
      
      if (response && response.success) {
        this.showSuccess('Device registered successfully!');
        await this.loadSetupStatus();
        this.updateSetupProgress();
      } else {
        this.showError('Device registration failed: ' + (response?.message || 'Unknown error'));
      }
      
    } catch (error) {
      this.hideLoading();
      this.showError('Device registration failed: ' + error.message);
    }
  }

  openPairing() {
    chrome.tabs.create({ url: 'nft-pairing.html' });
  }

  manageDevices() {
    chrome.tabs.create({ url: 'settings.html#devices' });
  }

  startUsing() {
    // Close popup and start using
    window.close();
  }

  openThoughts() {
    chrome.tabs.create({ url: 'thoughts.html' });
  }

  openInputHistory() {
    chrome.tabs.create({ url: 'input-history.html' });
  }

  openTrustNetwork() {
    chrome.tabs.create({ url: 'trust-network.html' });
  }

  showLoading(message) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingOverlay && loadingMessage) {
      loadingOverlay.classList.remove('hidden');
      loadingMessage.textContent = message;
    }
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }

  showSuccess(message) {
    this.showNotification('success', message);
  }

  showError(message) {
    this.showNotification('error', message);
  }

  showInfo(title, message) {
    this.showNotification('info', `${title}: ${message}`);
  }

  showNotification(type, message) {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = message;
      notification.className = `notification-${type}`;
      notification.classList.remove('hidden');
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 3000); // Hide after 3 seconds
    }
  }

  showHelp() {
    // Show help information
    this.showInfo('Help', 'For help and support, please contact the ecosystem coordination team.');
  }

  showAbout() {
    // Show about information
    this.showInfo('About Myl.Zip', 'Myl.Zip v2.0.0 - Secure Thought Assistant\n\nA Chrome extension for capturing, organizing, and securely sharing thoughts across devices.');
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const mylZipPopup = new MylZipPopup();
});
