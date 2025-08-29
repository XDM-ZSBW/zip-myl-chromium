// Myl.Zip Chromium Extension - Settings Page
// Handles settings configuration and backend connection testing

class MylZipSettings {
  constructor() {
    this.settings = null;
    
    this.init();
  }

  async init() {
    console.log('Myl.Zip Settings: Initializing...', new Date().toISOString());
    
    // Setup event listeners FIRST (before any async operations)
    console.log('Myl.Zip Settings: Setting up event listeners...');
    this.setupEventListeners();
    console.log('Myl.Zip Settings: Event listeners setup complete');
    
    // Load settings
    await this.loadSettings();
    
    // Update UI with current settings
    this.updateUI();
    
    // Initialize test status indicators
    this.initializeTestStatusIndicators();
    
    // Update encryption status
    await this.updateEncryptionStatus();
    
    // Update registration status
    this.updateRegistrationStatus();
    
    // Refresh trusted devices list
    await this.refreshTrustedDevices();
    
    // Load current pairing code
    await this.loadCurrentPairingCode();
    
    // Test initial connection (but don't let it block initialization)
    console.log('Myl.Zip Settings: Starting initial connection test...');
    this.testConnection().catch(error => {
      console.error('Initial connection test failed:', error);
    });
    
    console.log('Myl.Zip Settings: Ready');
  }

  async loadSettings() {
    try {
      // Check if chrome.runtime is available
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        this.settings = response.settings;
        console.log('Settings loaded from extension:', this.settings);
        console.log('Device registration from loaded settings:', this.settings?.deviceRegistration);
      } else {
        console.log('Chrome extension API not available, using default settings');
        this.settings = this.getDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      // Backend settings
      backendURL: 'http://localhost:3000',
      enableBackendSync: true,
      
      // General settings
      enableThoughtTracking: true,
      typingThreshold: 100,
      analysisDelay: 500,
      
      // Visual settings
      enableVisualFeedback: true,
      enablePopupOverlay: true,
      enableCursorIndicators: true,
      indicatorStyle: 'pulse',
      
      // Advanced settings
      enableRunOnDetection: true,
      runOnThreshold: 0.7,
      enableSoundFeedback: false,
      soundVolume: 50,
      enableDebugLogging: false,
      
      // Security settings
      allowShortFormatFallback: true // Allow short format fallback for UUID requests
    };
  }

  setupEventListeners() {
    try {
      // Navigation removed - using single page layout

      // Backend settings
      const testConnectionBtn = document.getElementById('testConnection');
      if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', () => {
          console.log('Test Connection button clicked');
          this.testConnection();
        });
      } else {
        console.error('Test Connection button not found');
      }

      // Device management
      const registerDeviceBtn = document.getElementById('registerDevice');
      if (registerDeviceBtn) {
        registerDeviceBtn.addEventListener('click', () => {
          console.log('Register Device button clicked');
          this.registerDevice();
        });
      } else {
        console.error('Register Device button not found');
      }

      const refreshDevicesBtn = document.getElementById('refreshDevices');
      if (refreshDevicesBtn) {
        refreshDevicesBtn.addEventListener('click', () => {
          console.log('Refresh Devices button clicked');
          this.refreshTrustedDevices();
        });
      } else {
        console.error('Refresh Devices button not found');
      }

      const manageDevicesBtn = document.getElementById('manageDevices');
      if (manageDevicesBtn) {
        manageDevicesBtn.addEventListener('click', () => {
          this.manageDevices();
        });
      } else {
        console.error('Manage Devices button not found');
      }

      const createSelfTrustBtn = document.getElementById('createSelfTrust');
      if (createSelfTrustBtn) {
        createSelfTrustBtn.addEventListener('click', () => {
          console.log('Create Self-Trust button clicked');
          this.createSelfTrust();
        });
      } else {
        console.error('Create Self-Trust button not found');
      }

      const refreshRegistrationBtn = document.getElementById('refreshRegistration');
      if (refreshRegistrationBtn) {
        refreshRegistrationBtn.addEventListener('click', () => {
          console.log('Refresh Registration button clicked');
          this.loadSettings().then(() => {
            this.updateRegistrationStatus();
          });
        });
      } else {
        console.error('Refresh Registration button not found');
      }

      // Add a method to refresh registration status
      window.refreshRegistrationStatus = () => {
        console.log('Manually refreshing registration status...');
        this.loadSettings().then(() => {
          this.updateRegistrationStatus();
        });
      };

      const generatePairingCodeBtn = document.getElementById('generatePairingCode');
      if (generatePairingCodeBtn) {
        generatePairingCodeBtn.addEventListener('click', () => {
          const formatSelect = document.getElementById('pairing-format');
          const format = formatSelect ? formatSelect.value : 'uuid';
          this.generatePairingCode(format);
        });
      }

      const copyPairingCodeBtn = document.getElementById('copyPairingCode');
      if (copyPairingCodeBtn) {
        copyPairingCodeBtn.addEventListener('click', () => {
          this.copyPairingCode();
        });
      }

      const verifyPairingCodeBtn = document.getElementById('verifyPairingCode');
      if (verifyPairingCodeBtn) {
        verifyPairingCodeBtn.addEventListener('click', () => {
          this.verifyPairingCode();
        });
      }

      // Status indicator event listeners
      const cancelGenerationBtn = document.getElementById('cancel-generation-btn');
      if (cancelGenerationBtn) {
        cancelGenerationBtn.addEventListener('click', () => {
          this.cancelGeneration();
        });
      }

      const retryGenerationBtn = document.getElementById('retry-generation-btn');
      if (retryGenerationBtn) {
        retryGenerationBtn.addEventListener('click', () => {
          this.retryGeneration();
        });
      }

      const setupEncryptionBtn = document.getElementById('setupEncryption');
      if (setupEncryptionBtn) {
        setupEncryptionBtn.addEventListener('click', () => {
          this.setupEncryption();
        });
      }

      const clearDeviceDataBtn = document.getElementById('clearDeviceData');
      if (clearDeviceDataBtn) {
        clearDeviceDataBtn.addEventListener('click', () => {
          this.clearDeviceData();
        });
      }

      const saveBackendSettingsBtn = document.getElementById('saveBackendSettings');
      if (saveBackendSettingsBtn) {
        saveBackendSettingsBtn.addEventListener('click', () => {
          this.saveBackendSettings();
        });
      }

      const skipBackendBtn = document.getElementById('skipBackend');
      if (skipBackendBtn) {
        skipBackendBtn.addEventListener('click', () => {
          this.skipBackendSetup();
        });
      }

      const resetBackendSettingsBtn = document.getElementById('resetBackendSettings');
      if (resetBackendSettingsBtn) {
        resetBackendSettingsBtn.addEventListener('click', () => {
          this.resetBackendSettings();
        });
      }

      // Navigation buttons
      const continueToPairingBtn = document.getElementById('continueToPairing');
      if (continueToPairingBtn) {
        continueToPairingBtn.addEventListener('click', () => {
          this.navigateToStep(3);
        });
      }

      const backToConnectionBtn = document.getElementById('backToConnection');
      if (backToConnectionBtn) {
        backToConnectionBtn.addEventListener('click', () => {
          this.navigateToStep(1);
        });
      }

      const backToSecurityBtn = document.getElementById('backToSecurity');
      if (backToSecurityBtn) {
        backToSecurityBtn.addEventListener('click', () => {
          this.navigateToStep(2);
        });
      }

      const completeSetupBtn = document.getElementById('completeSetup');
      if (completeSetupBtn) {
        completeSetupBtn.addEventListener('click', () => {
          this.navigateToStep(4);
        });
      }

      const startUsingBtn = document.getElementById('startUsing');
      if (startUsingBtn) {
        startUsingBtn.addEventListener('click', () => {
          window.location.href = 'popup.html';
        });
      }

      const openThoughtsBtn = document.getElementById('openThoughts');
      if (openThoughtsBtn) {
        openThoughtsBtn.addEventListener('click', () => {
          window.location.href = 'thoughts.html';
        });
      }

      const clearAuthBtn = document.getElementById('clearAuth');
      if (clearAuthBtn) {
        clearAuthBtn.addEventListener('click', () => {
          const authTokenInput = document.getElementById('authToken');
          if (authTokenInput) {
            authTokenInput.value = '';
          }
        });
      }

      // Range inputs
      const typingThresholdInput = document.getElementById('typingThreshold');
      if (typingThresholdInput) {
        typingThresholdInput.addEventListener('input', (e) => {
          const valueDisplay = document.getElementById('typingThresholdValue');
          if (valueDisplay) {
            valueDisplay.textContent = e.target.value;
          }
        });
      }

      const analysisDelayInput = document.getElementById('analysisDelay');
      if (analysisDelayInput) {
        analysisDelayInput.addEventListener('input', (e) => {
          const valueDisplay = document.getElementById('analysisDelayValue');
          if (valueDisplay) {
            valueDisplay.textContent = e.target.value;
          }
        });
      }

      const runOnThresholdInput = document.getElementById('runOnThreshold');
      if (runOnThresholdInput) {
        runOnThresholdInput.addEventListener('input', (e) => {
          const valueDisplay = document.getElementById('runOnThresholdValue');
          if (valueDisplay) {
            valueDisplay.textContent = e.target.value;
          }
        });
      }

      const soundVolumeInput = document.getElementById('soundVolume');
      if (soundVolumeInput) {
        soundVolumeInput.addEventListener('input', (e) => {
          const valueDisplay = document.getElementById('soundVolumeValue');
          if (valueDisplay) {
            valueDisplay.textContent = e.target.value;
          }
        });
      }

      // Security settings
      const allowShortFormatFallbackInput = document.getElementById('allowShortFormatFallback');
      if (allowShortFormatFallbackInput) {
        allowShortFormatFallbackInput.addEventListener('change', (e) => {
          this.settings.allowShortFormatFallback = e.target.checked;
          this.saveSecuritySettings();
        });
      }

      // Footer actions
      const exportSettingsBtn = document.getElementById('exportSettings');
      if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', () => {
          this.exportSettings();
        });
      }

      const importSettingsBtn = document.getElementById('importSettings');
      if (importSettingsBtn) {
        importSettingsBtn.addEventListener('click', () => {
          this.importSettings();
        });
      }

      const resetAllSettingsBtn = document.getElementById('resetAllSettings');
      if (resetAllSettingsBtn) {
        resetAllSettingsBtn.addEventListener('click', () => {
          this.resetAllSettings();
        });
      }

    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  // switchSection method removed - using single page layout

  updateUI() {
    // Backend settings
    document.getElementById('backendURL').value = this.settings.backendURL || 'http://localhost:3000';
    document.getElementById('enableBackendSync').checked = this.settings.enableBackendSync || false;

    // General settings
    document.getElementById('enableThoughtTracking').checked = this.settings.enableThoughtTracking || false;
    document.getElementById('typingThreshold').value = this.settings.typingThreshold || 100;
    document.getElementById('typingThresholdValue').textContent = this.settings.typingThreshold || 100;
    document.getElementById('analysisDelay').value = this.settings.analysisDelay || 500;
    document.getElementById('analysisDelayValue').textContent = this.settings.analysisDelay || 500;

    // Visual settings
    document.getElementById('enableVisualFeedback').checked = this.settings.enableVisualFeedback || false;
    document.getElementById('enablePopupOverlay').checked = this.settings.enablePopupOverlay || false;
    document.getElementById('enableCursorIndicators').checked = this.settings.enableCursorProximityIndicators || false;
    document.getElementById('indicatorStyle').value = this.settings.proximityIndicatorStyle || 'pulse';

    // Advanced settings
    document.getElementById('enableRunOnDetection').checked = this.settings.enableRunOnThoughtDetection || false;
    document.getElementById('runOnThreshold').value = this.settings.runOnThoughtThreshold || 0.7;
    document.getElementById('runOnThresholdValue').textContent = this.settings.runOnThoughtThreshold || 0.7;
    document.getElementById('enableSoundFeedback').checked = this.settings.enableSoundFeedback || false;
    document.getElementById('soundVolume').value = this.settings.soundVolume || 50;
    document.getElementById('soundVolumeValue').textContent = this.settings.soundVolume || 50;
    document.getElementById('enableDebugLogging').checked = this.settings.enableDebugLogging || false;
    
    // Security settings
    document.getElementById('allowShortFormatFallback').checked = this.settings.allowShortFormatFallback !== false;
  }

  async testConnection() {
    console.log('Myl.Zip Settings: testConnection called');
    const backendURL = document.getElementById('backendURL').value;
    if (!backendURL) {
      this.updateConnectionStatus('error', 'No URL provided');
      this.showNotification('Please enter a backend URL', 'error');
      return;
    }

    console.log('Myl.Zip Settings: Testing connection to:', backendURL);
    
    // Update test connection button to show loading state
    const testBtn = document.getElementById('testConnection');
    if (testBtn) {
      testBtn.textContent = 'Testing...';
      testBtn.disabled = true;
      testBtn.classList.add('testing');
    }
    
    // Reset all status indicators
    this.updateConnectionStatus('connecting', 'Testing connection...');
    this.updateTestResults('connectionStatus', 'Testing...', 'testing');
    this.updateTestResults('securityStatus', 'Testing...', 'testing');
    this.updateTestResults('apiStatus', 'Testing...', 'testing');

    try {
      // Update backend URL in background script
      await chrome.runtime.sendMessage({
        type: 'UPDATE_BACKEND_URL',
        url: backendURL
      });

      // Test health endpoint via background script
      const healthResponse = await chrome.runtime.sendMessage({
        type: 'BACKEND_HEALTH_CHECK'
      });

      console.log('Health check response:', healthResponse);

      if (healthResponse && healthResponse.success && healthResponse.isHealthy) {
        // Connection successful
        this.updateTestResults('connectionStatus', 'Connected', 'success');
        this.updateTestResults('securityStatus', 'Available', 'success');
        this.updateTestResults('apiStatus', 'Available', 'success');
        this.updateConnectionStatus('connected', `Connected to ${backendURL}`);
        this.showNotification('Connection test successful!', 'success');
        
        // Update the backend URL field to show it was saved
        document.getElementById('backendURL').classList.add('saved');
        setTimeout(() => {
          document.getElementById('backendURL').classList.remove('saved');
        }, 2000);
        
        // Reset test connection button
        this.resetTestButton();
        
      } else if (healthResponse && healthResponse.success === false) {
        // Connection failed with specific error
        this.updateTestResults('connectionStatus', 'Failed', 'error');
        this.updateTestResults('securityStatus', 'Unavailable', 'error');
        this.updateTestResults('apiStatus', 'Unavailable', 'error');
        this.updateConnectionStatus('error', 'Connection failed');
        this.showNotification(`Connection failed: ${healthResponse.error || 'Unknown error'}`, 'error');
        
        // Reset test connection button
        this.resetTestButton();
        
      } else {
        // Unexpected response format
        this.updateTestResults('connectionStatus', 'Failed', 'error');
        this.updateTestResults('securityStatus', 'Unknown', 'error');
        this.updateTestResults('apiStatus', 'Unknown', 'error');
        this.updateConnectionStatus('error', 'Invalid response');
        this.showNotification('Connection test failed: Invalid response format', 'error');
        
        // Reset test connection button
        this.resetTestButton();
      }
      
    } catch (error) {
      console.error('Connection test failed:', error);
      this.updateTestResults('connectionStatus', 'Error', 'error');
      this.updateTestResults('apiStatus', 'Error', 'error');
      this.updateConnectionStatus('error', 'Connection failed');
      this.showNotification(`Connection test failed: ${error.message}`, 'error');
      
      // Reset test connection button
      this.resetTestButton();
    }
  }



  updateConnectionStatus(status, text) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    if (statusIndicator && statusText) {
      statusIndicator.className = `status-indicator ${status}`;
      statusText.textContent = text;
    } else {
      console.warn('Status indicator elements not found for connection status update');
    }
  }

  updateTestResults(elementId, text, status) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
      element.className = `test-status ${status}`;
    } else {
      console.warn(`Element with ID '${elementId}' not found for test results update`);
    }
  }

  initializeTestStatusIndicators() {
    // Set initial state for test status indicators
    this.updateTestResults('connectionStatus', 'Not tested', 'not-tested');
    this.updateTestResults('securityStatus', 'Not tested', 'not-tested');
    this.updateTestResults('apiStatus', 'Not tested', 'not-tested');
    
    // Set initial connection status
    this.updateConnectionStatus('error', 'Not connected');
  }

  resetTestButton() {
    const testBtn = document.getElementById('testConnection');
    if (testBtn) {
      testBtn.textContent = 'Test Connection';
      testBtn.disabled = false;
      testBtn.classList.remove('testing');
    }
  }

  async saveBackendSettings() {
    try {
      const backendURL = document.getElementById('backendURL').value;
      const enableBackendSync = document.getElementById('enableBackendSync').checked;

      const updatedSettings = {
        ...this.settings,
        backendURL: backendURL,
        enableBackendSync: enableBackendSync
      };

      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: updatedSettings
      });

      this.settings = updatedSettings;
      this.showNotification('Backend settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save backend settings:', error);
      this.showNotification('Failed to save backend settings', 'error');
    }
  }

  async resetBackendSettings() {
    if (confirm('Are you sure you want to reset backend settings to default?')) {
      const defaultSettings = this.getDefaultSettings();
      
      document.getElementById('backendURL').value = defaultSettings.backendURL;
      document.getElementById('enableBackendSync').checked = defaultSettings.enableBackendSync;
      document.getElementById('authToken').value = '';

      this.showNotification('Backend settings reset to default', 'success');
    }
  }

  async skipBackendSetup() {
    this.showNotification('Backend setup skipped. You can configure it later in advanced settings.', 'info');
    // Move to next step or complete setup
    this.completeBackendSetup();
  }

  completeBackendSetup() {
    // Hide current step and show next step
    const currentStep = document.getElementById('step1Section');
    const nextStep = document.getElementById('step2Section');
    
    if (currentStep && nextStep) {
      currentStep.classList.remove('active');
      nextStep.classList.add('active');
      
      // Update wizard progress
      this.updateWizardProgress(2);
    }
  }

  updateWizardProgress(stepNumber) {
    // Update wizard step indicators
    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach((step, index) => {
      if (index + 1 <= stepNumber) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  navigateToStep(stepNumber) {
    // Hide all steps
    const allSteps = document.querySelectorAll('.settings-section');
    allSteps.forEach(step => step.classList.remove('active'));
    
    // Show the target step
    const targetStep = document.getElementById(`step${stepNumber}Section`);
    if (targetStep) {
      targetStep.classList.add('active');
    }
    
    // Update wizard progress
    this.updateWizardProgress(stepNumber);
  }

  manageDevices() {
    // Show device management interface
    this.showNotification('Device management interface coming soon!', 'info');
    // For now, just refresh the device list
    this.refreshTrustedDevices();
  }

  async exportSettings() {
    try {
      const settingsData = {
        settings: this.settings,
        exportDate: new Date().toISOString(),
        version: chrome.runtime.getManifest().version
      };

      const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `myl-zip-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showNotification('Settings exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showNotification('Failed to export settings', 'error');
    }
  }

  async importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.settings) {
          await chrome.runtime.sendMessage({
            type: 'UPDATE_SETTINGS',
            settings: data.settings
          });

          this.settings = data.settings;
          this.updateUI();
          this.showNotification('Settings imported successfully', 'success');
        } else {
          throw new Error('Invalid settings file format');
        }
      } catch (error) {
        console.error('Failed to import settings:', error);
        this.showNotification('Failed to import settings: ' + error.message, 'error');
      }
    };

    input.click();
  }

  async resetAllSettings() {
    if (confirm('Are you sure you want to reset ALL settings to default? This cannot be undone.')) {
      try {
        const defaultSettings = this.getDefaultSettings();
        
        await chrome.runtime.sendMessage({
          type: 'UPDATE_SETTINGS',
          settings: defaultSettings
        });

        this.settings = defaultSettings;
        this.updateUI();
        this.showNotification('All settings reset to default', 'success');
      } catch (error) {
        console.error('Failed to reset settings:', error);
        this.showNotification('Failed to reset settings', 'error');
      }
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
    `;

    // Set background color based on type
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#4CAF50';
        break;
      case 'error':
        notification.style.backgroundColor = '#F44336';
        break;
      case 'warning':
        notification.style.backgroundColor = '#FF9800';
        break;
      default:
        notification.style.backgroundColor = '#2196F3';
    }

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Device Management Methods
  getDeviceName() {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) {
      if (platform.includes('win')) {
        return 'Chrome Extension (Windows)';
      } else if (platform.includes('mac')) {
        return 'Chrome Extension (macOS)';
      } else if (platform.includes('linux')) {
        return 'Chrome Extension (Linux)';
      }
    }

    return 'Chrome Extension';
  }

  async registerDevice() {
    try {
      console.log('Myl.Zip Settings: Registering device...');
      this.updateConnectionStatus('loading', 'Registering device...');
      
      // Get comprehensive device information
      const deviceInfo = {
        name: this.getDeviceName(),
        type: 'chrome-extension',
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        capabilities: ['encrypt', 'decrypt', 'share'],
        version: chrome.runtime.getManifest().version,
        extensionId: chrome.runtime.id,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timestamp: new Date().toISOString()
      };
      
      const response = await chrome.runtime.sendMessage({ 
        type: 'REGISTER_DEVICE',
        deviceInfo: deviceInfo
      });
      
      if (response.success) {
        this.updateConnectionStatus('success', 'Device registered successfully');
        this.showNotification('Device registered! You can now generate pairing codes.', 'success');
        
        // Update registration status
        this.updateRegistrationStatus();
        
        // Wait a moment for self-trust to be created, then refresh
        setTimeout(async () => {
          await this.refreshTrustedDevices();
        }, 1000);
      } else {
        this.updateConnectionStatus('error', response.message || 'Failed to register device');
        this.showNotification('Failed to register device: ' + (response.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error registering device:', error);
      this.updateConnectionStatus('error', 'Failed to register device');
      this.showNotification('Failed to register device: ' + error.message, 'error');
    }
  }

  async refreshTrustedDevices() {
    try {
      console.log('Settings: Requesting trusted devices...');
      
      // Show loading state in device list
      this.showDeviceListLoading();
      
      const response = await chrome.runtime.sendMessage({ type: 'GET_TRUSTED_DEVICES' });
      console.log('Settings: Received trusted devices response:', response);
      
      if (response.success) {
        console.log('Settings: Updating trusted devices list with:', response.devices);
        this.updateTrustedDevicesList(response.devices);
        this.updateEncryptionStatus();
        
        // Log device count for user feedback
        const deviceCount = response.devices ? response.devices.length : 0;
        console.log(`Settings: Trusted devices list refreshed. Found ${deviceCount} trusted device(s).`);
        
        // Show brief notification if devices were found
        if (deviceCount > 0) {
          setTimeout(() => {
            this.showNotification(`📱 Found ${deviceCount} trusted device${deviceCount > 1 ? 's' : ''}`, 'info');
          }, 200);
        }
      } else {
        console.error('Failed to get trusted devices:', response.message);
        this.showNotification('Failed to refresh device list', 'error');
        // Show empty state on error
        this.updateTrustedDevicesList([]);
      }
    } catch (error) {
      console.error('Error refreshing trusted devices:', error);
      this.showNotification('Error refreshing device list', 'error');
      // Show empty state on error
      this.updateTrustedDevicesList([]);
    }
  }

  async loadCurrentPairingCode() {
    try {
      console.log('Settings: Loading current pairing code...');
      
      // Check if encryption is established first
      const encryptionStatus = await chrome.runtime.sendMessage({ type: 'GET_ENCRYPTION_STATUS' });
      
      if (encryptionStatus && encryptionStatus.success && encryptionStatus.status && encryptionStatus.status.isEncryptionSetup) {
        // Encryption is established, get current pairing code
        const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_PAIRING_CODE' });
        
        if (response.success && response.pairingCode) {
          // Display the current pairing code with format information
          this.updatePairingCodeDisplay(response.pairingCode, response.format, response.expiresAt);
          console.log('Settings: Current pairing code loaded:', response.pairingCode, 'format:', response.format);
          
          // Update button text to indicate it will generate a new code
          const generateButton = document.getElementById('generatePairingCode');
          if (generateButton) {
            generateButton.textContent = 'Generate New Code';
          }
        } else {
          // No current pairing code, show placeholder
          document.getElementById('pairingCodeDisplay').value = 'No active pairing code';
          console.log('Settings: No current pairing code found');
        }
      } else {
        // Encryption not established, show message
        document.getElementById('pairingCodeDisplay').value = 'Encryption setup required';
        console.log('Settings: Encryption not established, pairing code not available');
      }
    } catch (error) {
      console.error('Error loading current pairing code:', error);
      document.getElementById('pairingCodeDisplay').value = 'Error loading pairing code';
    }
  }

  /**
   * Show loading state in the trusted devices list
   */
  showDeviceListLoading() {
    const devicesList = document.getElementById('trustedDevicesList');
    devicesList.innerHTML = `
      <div class="device-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Refreshing device list...</div>
      </div>
    `;
  }

  async createSelfTrust() {
    try {
      console.log('Settings: Creating self-trust...');
      console.log('Settings: Current settings:', this.settings);
      console.log('Settings: Device registration status:', this.settings?.deviceRegistration);
      
      const response = await chrome.runtime.sendMessage({ type: 'CREATE_SELF_TRUST' });
      console.log('Settings: Create self-trust response:', response);
      
      if (response.success) {
        this.showNotification('Self-trust created successfully!', 'success');
        await this.refreshTrustedDevices();
      } else {
        this.showNotification('Failed to create self-trust: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('Error creating self-trust:', error);
      this.showNotification('Failed to create self-trust: ' + error.message, 'error');
    }
  }

  updateTrustedDevicesList(devices) {
    console.log('Settings: updateTrustedDevicesList called with:', devices);
    const devicesList = document.getElementById('trustedDevicesList');
    
    if (!devices || devices.length === 0) {
      console.log('Settings: No devices to display, showing "No trusted devices found"');
      devicesList.innerHTML = '<div class="no-devices">No trusted devices found</div>';
      return;
    }

    console.log('Settings: Rendering', devices.length, 'trusted devices');
    devicesList.innerHTML = devices.map(device => `
      <div class="device-item">
        <div class="device-info">
          <div class="device-name">${device.deviceInfo?.name || 'Unknown Device'}</div>
          <div class="device-details">
            ${device.deviceInfo?.type || 'Unknown'} • 
            Trusted ${new Date(device.trustedAt).toLocaleDateString()}
          </div>
        </div>
        <div class="device-actions">
          <button class="device-action-btn remove" onclick="settingsManager.removeTrustedDevice('${device.deviceId}')">
            Remove
          </button>
        </div>
      </div>
    `).join('');
  }

  async generatePairingCode(format = 'uuid') {
    try {
      // Show status indicator and start progress tracking
      this.showGenerationStatus('preparing', 'Preparing pairing code generation...');
      this.updateProgress(10);
      
      // Check if encryption is already established
      const encryptionStatus = await chrome.runtime.sendMessage({ type: 'GET_ENCRYPTION_STATUS' });
      
      if (encryptionStatus && encryptionStatus.success && encryptionStatus.status && encryptionStatus.status.isEncryptionSetup) {
        // Encryption is already established, generate pairing code directly
        console.log('Settings: Encryption already established, generating pairing code with format:', format);
        this.updateConnectionStatus('connecting', 'Generating pairing code...');
        this.showNotification(`Generating ${format.toUpperCase()} pairing code...`, 'info');
        
        this.updateProgress(30);
        this.updateGenerationStatus('generating', `Generating ${format.toUpperCase()} pairing code...`);
        
        const response = await chrome.runtime.sendMessage({ 
          type: 'GENERATE_PAIRING_CODE',
          format: format,
          expiresIn: 300
        });
        
        this.updateProgress(80);
        this.updateGenerationStatus('validating', 'Validating generated pairing code...');
        
        if (response.success) {
          // Check if this is a pending state
          if (response.pending) {
            console.log('Settings: NFT generation is pending, showing progress...');
            this.updateConnectionStatus('connecting', 'NFT generation in progress...');
            this.showNotification('NFT generation in progress. Please wait...', 'info');
            
            // Update UI to show pending state
            this.updatePairingCodeDisplay('Generating...', response.format, response.expiresAt);
            
            // Show progress with pending status
            this.updateProgress(80);
            this.updateGenerationStatus('pending', response.message || 'NFT generation in progress');
            
            // For now, just show the pending state without complex polling
            // The user can retry if needed
            return;
          }
          
          // Normal success case
          document.getElementById('pairingCodeDisplay').value = response.pairingCode;
          this.updateConnectionStatus('success', 'Pairing code generated successfully');
          
          // Check for format mismatch
          if (response.requestedFormat && response.format !== response.requestedFormat) {
            console.warn('Settings: Format mismatch detected. Requested:', response.requestedFormat, 'but got:', response.format);
            this.showNotification(`Warning: Requested ${response.requestedFormat.toUpperCase()} but got ${response.format.toUpperCase()} format. Backend may not support format selection yet.`, 'warning');
          } else {
            this.showNotification(`${response.format.toUpperCase()} pairing code generated! Share this code with other devices.`, 'success');
          }
          
          console.log('Generated pairing code:', response.pairingCode, 'format:', response.format, 'requested:', response.requestedFormat);
          
          // Update UI to show format information
          this.updatePairingCodeDisplay(response.pairingCode, response.format, response.expiresAt);
          
          this.updateProgress(100);
          this.updateGenerationStatus('success', 'Pairing code generated successfully!');
          
          // Hide status after success
          setTimeout(() => {
            this.hideGenerationStatus();
          }, 3000);
        } else {
          this.updateGenerationStatus('error', 'Failed to generate pairing code: ' + (response.error || 'Unknown error'));
          this.updateConnectionStatus('error', 'Failed to generate pairing code');
          this.showNotification('Failed to generate pairing code: ' + (response.error || 'Unknown error'), 'error');
          
          // Show retry button
          const retryBtn = document.getElementById('retry-generation-btn');
          if (retryBtn) {
            retryBtn.classList.remove('hidden');
          }
        }
      } else {
        // Encryption not established, require captcha puzzle
        console.log('Settings: Encryption not established, requiring captcha puzzle');
        this.updateGenerationStatus('info', 'Encryption setup required for pairing code generation');
        this.updateConnectionStatus('info', 'Encryption setup required for pairing code generation');
        this.showNotification('Encryption setup required. Please complete the puzzle to generate a pairing code.', 'info');
        
        // Open the encryption setup puzzle page for pairing code generation
        const setupWindow = window.open(
          chrome.runtime.getURL('encryption-setup.html'),
          'pairing-code-setup',
          'width=700,height=800,scrollbars=yes,resizable=yes'
        );
        
        if (!setupWindow) {
          this.updateGenerationStatus('error', 'Please allow popups to generate pairing code');
          this.updateConnectionStatus('error', 'Please allow popups to generate pairing code');
          this.showNotification('Please allow popups to generate pairing code', 'error');
          return;
        }
        
        // Listen for messages from the setup window
        const messageHandler = (event) => {
          if (event.data.type === 'ENCRYPTION_SETUP_COMPLETE') {
            this.handlePairingCodeGenerated(event.data.password, event.data.interactionData);
            window.removeEventListener('message', messageHandler);
          } else if (event.data.type === 'ENCRYPTION_SETUP_CANCELLED') {
            this.updateGenerationStatus('info', 'Pairing code generation cancelled');
            this.updateConnectionStatus('info', 'Pairing code generation cancelled');
            this.showNotification('Pairing code generation cancelled', 'info');
            window.removeEventListener('message', messageHandler);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Focus the setup window
        setupWindow.focus();
      }
      
    } catch (error) {
      console.error('Error generating pairing code:', error);
      this.updateGenerationStatus('error', 'Failed to generate pairing code: ' + error.message);
      this.updateConnectionStatus('error', 'Failed to generate pairing code');
      this.showNotification('Failed to generate pairing code', 'error');
      
      // Show retry button
      const retryBtn = document.getElementById('retry-generation-btn');
      if (retryBtn) {
        retryBtn.classList.remove('hidden');
      }
    }
  }

  async handlePairingCodeGenerated(password, interactionData) {
    try {
      console.log('Pairing code generated with password:', password);
      console.log('Interaction data:', interactionData);
      
      // Use the generated password as the pairing code
      document.getElementById('pairingCodeDisplay').value = password;
      this.updateConnectionStatus('success', 'Pairing code generated successfully');
      this.showNotification('Pairing code generated! Share this code with other devices.', 'success');
      
    } catch (error) {
      console.error('Error handling pairing code generation:', error);
      this.updateConnectionStatus('error', 'Failed to generate pairing code');
      this.showNotification('Failed to generate pairing code', 'error');
    }
  }

  /**
   * Simple pending status handler for NFT generation
   */
  handlePendingNFTGeneration(response) {
    console.log('Settings: Handling pending NFT generation...');
    
    // Update UI to show pending state
    this.updatePairingCodeDisplay('Generating...', response.format, response.expiresAt);
    this.updateProgress(80);
    this.updateGenerationStatus('pending', response.message || 'NFT generation in progress');
    
    // Show retry button after a delay
    setTimeout(() => {
      const retryBtn = document.getElementById('retry-generation-btn');
      if (retryBtn) {
        retryBtn.classList.remove('hidden');
      }
    }, 5000); // Show retry after 5 seconds
  }

  async copyPairingCode() {
    const pairingCodeInput = document.getElementById('pairingCodeDisplay');
    if (pairingCodeInput.value) {
      try {
        await navigator.clipboard.writeText(pairingCodeInput.value);
        this.updateConnectionStatus('success', 'Pairing code copied to clipboard');
      } catch (error) {
        console.error('Error copying pairing code:', error);
        this.updateConnectionStatus('error', 'Failed to copy pairing code');
      }
    }
  }

  async verifyPairingCode() {
    const pairingCodeInput = document.getElementById('pairingCodeInput');
    const code = pairingCodeInput.value.trim();
    
    if (!code) {
      this.updateConnectionStatus('error', 'Please enter a pairing code');
      this.showNotification('Please enter a pairing code to continue', 'warning');
      return;
    }

    // Check if encryption is established first - SECURITY REQUIREMENT
    const encryptionStatus = await chrome.runtime.sendMessage({ type: 'GET_ENCRYPTION_STATUS' });
    
    if (!encryptionStatus || !encryptionStatus.success || !encryptionStatus.status || !encryptionStatus.status.isEncryptionSetup) {
      // Encryption not established, require puzzle first
      console.log('Settings: Encryption not established, requiring encryption setup before pairing code verification');
      this.updateConnectionStatus('error', 'Encryption setup required');
      this.showNotification('🔒 Encryption setup required before pairing code verification. Please complete the puzzle first.', 'warning');
      
      // Open the encryption setup puzzle page
      const setupWindow = window.open(
        chrome.runtime.getURL('encryption-setup.html'),
        'encryption-setup',
        'width=700,height=800,scrollbars=yes,resizable=yes'
      );
      
      if (!setupWindow) {
        this.updateConnectionStatus('error', 'Please allow popups to setup encryption');
        this.showNotification('Please allow popups to setup encryption', 'error');
        return;
      }
      
      // Listen for messages from the setup window
      const messageHandler = (event) => {
        if (event.data.type === 'ENCRYPTION_SETUP_COMPLETE') {
          this.handleEncryptionSetupComplete(event.data.password, event.data.interactionData);
          window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'ENCRYPTION_SETUP_CANCELLED') {
          this.updateConnectionStatus('info', 'Encryption setup cancelled');
          this.showNotification('Encryption setup cancelled', 'info');
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Focus the setup window
      setupWindow.focus();
      return;
    }

    // Validate pairing code format (supports UUID, short, and legacy formats)
    const validation = this.validatePairingCode(code);
    if (!validation.valid) {
      this.updateConnectionStatus('error', 'Invalid pairing code format');
      this.showNotification(`Invalid pairing code format: ${validation.error}`, 'error');
      return;
    }
    
    console.log('Settings: Valid pairing code format detected:', validation.format);

    // Show loading state
    this.updateConnectionStatus('connecting', 'Verifying pairing code...');
    this.showNotification('Verifying pairing code...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'VERIFY_PAIRING_CODE', 
        pairingCode: code 
      });
      
      if (response.success) {
        // Clear the input field
        pairingCodeInput.value = '';
        
        // Show success messages
        this.updateConnectionStatus('success', 'Device trust established successfully');
        this.showNotification('✅ Pairing successful! Device added to trusted list.', 'success');
        
        // Log success details
        console.log('Settings: Pairing code verification successful');
        console.log('Settings: Trust relationship data:', response.data);
        
        // Automatically refresh the trusted devices list
        console.log('Settings: Refreshing trusted devices list...');
        await this.refreshTrustedDevices();
        
        // Show additional success notification after refresh
        setTimeout(() => {
          this.showNotification('Device list updated! You can now share data securely.', 'success');
        }, 500);
        
      } else {
        // Handle specific error cases with detailed messages
        let errorMessage = 'Failed to verify pairing code';
        let notificationMessage = 'Pairing code verification failed';
        
        if (response.error) {
          switch (response.error) {
            case 'Invalid pairing code':
              errorMessage = 'Invalid pairing code';
              notificationMessage = '❌ This pairing code is not valid. Please check and try again.';
              break;
            case 'Pairing code has expired':
              errorMessage = 'Pairing code expired';
              notificationMessage = '⏰ This pairing code has expired. Please generate a new one.';
              break;
            case 'Cannot pair device with itself':
              errorMessage = 'Cannot pair with same device';
              notificationMessage = '⚠️ You cannot pair a device with itself.';
              break;
            case 'Invalid pairing code format. Expected UUID format.':
              errorMessage = 'Invalid pairing code format';
              notificationMessage = '❌ Pairing code format not recognized.';
              break;
            case 'Only UUID format is supported for security reasons. Backend returned short format.':
              errorMessage = 'Backend UUID support pending';
              notificationMessage = '⚠️ Backend team is working on UUID support. Short format accepted as fallback.';
              break;
            default:
              errorMessage = response.error;
              notificationMessage = `❌ ${response.error}`;
          }
        }
        
        this.updateConnectionStatus('error', errorMessage);
        this.showNotification(notificationMessage, 'error');
        
        console.log('Settings: Pairing code verification failed:', response.error);
      }
    } catch (error) {
      console.error('Error verifying pairing code:', error);
      this.updateConnectionStatus('error', 'Failed to verify pairing code');
      this.showNotification('❌ Network error. Please check your connection and try again.', 'error');
    }
  }

  async removeTrustedDevice(deviceId) {
    if (!confirm('Are you sure you want to remove this trusted device?')) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'REMOVE_TRUSTED_DEVICE', 
        deviceId: deviceId 
      });
      
      if (response.success) {
        this.updateConnectionStatus('success', 'Trusted device removed');
        await this.refreshTrustedDevices();
      } else {
        this.updateConnectionStatus('error', response.message || 'Failed to remove device');
      }
    } catch (error) {
      console.error('Error removing trusted device:', error);
      this.updateConnectionStatus('error', 'Failed to remove device');
    }
  }

  async setupEncryption() {
    try {
      // Open the encryption setup puzzle page
      const setupWindow = window.open(
        chrome.runtime.getURL('encryption-setup.html'),
        'encryption-setup',
        'width=700,height=800,scrollbars=yes,resizable=yes'
      );
      
      if (!setupWindow) {
        this.updateConnectionStatus('error', 'Please allow popups to setup encryption');
        return;
      }
      
      // Listen for messages from the setup window
      const messageHandler = (event) => {
        if (event.data.type === 'ENCRYPTION_SETUP_COMPLETE') {
          this.handleEncryptionSetupComplete(event.data.password, event.data.interactionData);
          window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'ENCRYPTION_SETUP_CANCELLED') {
          this.updateConnectionStatus('info', 'Encryption setup cancelled');
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Focus the setup window
      setupWindow.focus();
      
    } catch (error) {
      console.error('Error opening encryption setup:', error);
      this.updateConnectionStatus('error', 'Failed to open encryption setup');
    }
  }

  async handleEncryptionSetupComplete(password, interactionData) {
    try {
      console.log('Encryption setup completed with generated password');
      console.log('Interaction data:', interactionData);
      
      const response = await chrome.runtime.sendMessage({ 
        type: 'SETUP_ENCRYPTION', 
        password: password,
        interactionData: interactionData
      });
      
      console.log('Encryption setup response:', response);
      
      if (response && response.success) {
        this.updateConnectionStatus('success', 'Encryption setup completed successfully');
        this.updateEncryptionStatus();
        this.showNotification('Encryption setup completed! Your device is now secure.', 'success');
      } else {
        this.updateConnectionStatus('error', response.message || 'Failed to setup encryption');
        this.showNotification('Failed to setup encryption: ' + (response.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error handling encryption setup completion:', error);
      this.updateConnectionStatus('error', 'Failed to setup encryption');
      this.showNotification('Failed to setup encryption', 'error');
    }
  }

  async clearDeviceData() {
    if (!confirm('Are you sure you want to clear all device data? This will remove all trusted devices and encryption keys.')) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({ type: 'CLEAR_DEVICE_DATA' });
      if (response.success) {
        this.updateConnectionStatus('success', 'Device data cleared');
        this.updateTrustedDevicesList([]);
        this.updateEncryptionStatus();
      } else {
        this.updateConnectionStatus('error', response.message || 'Failed to clear device data');
      }
    } catch (error) {
      console.error('Error clearing device data:', error);
      this.updateConnectionStatus('error', 'Failed to clear device data');
    }
  }

  updateRegistrationStatus() {
    const statusElement = document.getElementById('registrationStatusValue');
    if (statusElement) {
      console.log('Settings: Updating registration status...');
      console.log('Settings: Current settings:', this.settings);
      console.log('Settings: Device registration:', this.settings?.deviceRegistration);
      
      const isRegistered = this.settings?.deviceRegistration?.isRegistered || false;
      console.log('Settings: Is registered:', isRegistered);
      
      statusElement.textContent = isRegistered ? 'Registered' : 'Not Registered';
      statusElement.className = `status-value ${isRegistered ? 'registered' : 'not-registered'}`;
      
      if (isRegistered) {
        const deviceInfo = this.settings.deviceRegistration?.deviceInfo;
        if (deviceInfo) {
          const deviceName = deviceInfo.name || 'Chrome Extension';
          const deviceType = deviceInfo.type || 'chrome-extension';
          statusElement.textContent = `Registered: ${deviceName}`;
        } else {
          statusElement.textContent = 'Registered';
        }
      }
    }
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
   * Update pairing code display with format information
   * @param {string} code - Pairing code
   * @param {string} format - Code format
   * @param {string} expiresAt - Expiration timestamp
   */
  updatePairingCodeDisplay(code, format, expiresAt) {
    const displayElement = document.getElementById('pairingCodeDisplay');
    if (displayElement) {
      displayElement.value = code;
      
      // Add format indicator if not already present
      const formatIndicator = document.getElementById('pairingCodeFormat');
      if (formatIndicator) {
        formatIndicator.textContent = `Format: ${format.toUpperCase()}`;
        formatIndicator.className = `format-indicator format-${format}`;
      }
    }
  }

  async updateEncryptionStatus() {
    try {
      console.log('Myl.Zip Settings: Getting encryption status...');
      const response = await chrome.runtime.sendMessage({ type: 'GET_ENCRYPTION_STATUS' });
      console.log('Myl.Zip Settings: Encryption status response:', response);
      
      if (response && response.success) {
        const status = response.status;
        
        // Update encryption status
        const encryptionStatus = document.getElementById('encryptionStatus');
        encryptionStatus.textContent = status.isEncryptionSetup ? 'Enabled' : 'Disabled';
        encryptionStatus.className = `status-indicator ${status.isEncryptionSetup ? 'success' : 'error'}`;
        
        // Update device registration status
        const deviceStatus = document.getElementById('deviceRegistrationStatus');
        deviceStatus.textContent = status.isDeviceRegistered ? 'Registered' : 'Not Registered';
        deviceStatus.className = `status-indicator ${status.isDeviceRegistered ? 'success' : 'error'}`;
        
        // Update trusted devices count
        const devicesCount = document.getElementById('trustedDevicesCount');
        devicesCount.textContent = status.trustedDevicesCount || 0;
        devicesCount.className = `status-indicator ${status.trustedDevicesCount > 0 ? 'success' : 'info'}`;
      }
    } catch (error) {
      console.error('Error updating encryption status:', error);
    }
  }

  /**
   * Save security settings to the background script
   */
  async saveSecuritySettings() {
    try {
      console.log('Myl.Zip Settings: Saving security settings...');
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
          allowShortFormatFallback: this.settings.allowShortFormatFallback
        }
      });
      
      if (response && response.success) {
        console.log('Myl.Zip Settings: Security settings saved successfully');
        this.showNotification('Security settings saved', 'success');
      } else {
        console.error('Myl.Zip Settings: Failed to save security settings:', response?.error);
        this.showNotification('Failed to save security settings', 'error');
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
      this.showNotification('Error saving security settings', 'error');
    }
  }

  /**
   * Generation status indicator management
   */
  showGenerationStatus(status, message) {
    const statusElement = document.getElementById('pairing-generation-status');
    if (!statusElement) return;

    // Remove all status classes
    statusElement.classList.remove('hidden', 'processing', 'success', 'error', 'info');
    
    // Add appropriate status class
    statusElement.classList.add(status === 'success' ? 'success' : 
                              status === 'error' ? 'error' : 
                              status === 'info' ? 'info' : 'processing');
    
    // Update status message
    const messageElement = document.getElementById('status-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    // Update status icon
    const iconElement = statusElement.querySelector('.status-icon');
    if (iconElement) {
      iconElement.textContent = this.getStatusIcon(status);
    }
    
    // Show status element
    statusElement.classList.remove('hidden');
    
    // Start timing
    this.startGenerationTimer();
  }

  updateGenerationStatus(status, message) {
    const messageElement = document.getElementById('status-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    const iconElement = document.getElementById('pairing-generation-status')?.querySelector('.status-icon');
    if (iconElement) {
      iconElement.textContent = this.getStatusIcon(status);
    }
    
    // Update CSS classes for proper styling
    const statusElement = document.getElementById('pairing-generation-status');
    if (statusElement) {
      // Remove all status classes
      statusElement.classList.remove('processing', 'success', 'error', 'pending', 'info');
      
      // Add the appropriate status class
      if (status === 'preparing' || status === 'generating' || status === 'validating') {
        statusElement.classList.add('processing');
      } else if (status === 'success') {
        statusElement.classList.add('success');
      } else if (status === 'error') {
        statusElement.classList.add('error');
      } else if (status === 'pending') {
        statusElement.classList.add('pending');
      } else if (status === 'info') {
        statusElement.classList.add('info');
      }
    }
  }

  updateProgress(percentage) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${percentage}%`;
    }
  }

  getStatusIcon(status) {
    const icons = {
      'preparing': '⚙️',
      'generating': '🎨',
      'validating': '🔍',
      'success': '✅',
      'error': '❌',
      'info': 'ℹ️',
      'pending': '⏳'
    };
    return icons[status] || '⏳';
  }

  startGenerationTimer() {
    this.generationStartTime = Date.now();
    this.updateTimer();
  }

  updateTimer() {
    if (!this.generationStartTime) return;
    
    const elapsed = Date.now() - this.generationStartTime;
    const elapsedElement = document.getElementById('time-elapsed');
    
    if (elapsedElement) {
      elapsedElement.textContent = this.formatTime(elapsed);
    }
    
    // Continue updating every second
    if (elapsed < 300000) { // 5 minutes max
      setTimeout(() => this.updateTimer(), 1000);
    }
  }

  formatTime(elapsed) {
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds % 60}s`;
  }

  hideGenerationStatus() {
    const statusElement = document.getElementById('pairing-generation-status');
    if (statusElement) {
      statusElement.classList.add('hidden');
    }
  }

  /**
   * Cancel current generation
   */
  cancelGeneration() {
    console.log('Settings: Generation cancelled by user');
    
    // Update status to show cancellation
    this.updateGenerationStatus('info', 'Generation cancelled');
    
    // Hide status after a short delay
    setTimeout(() => {
      this.hideGenerationStatus();
    }, 2000);
    
    // Reset progress
    this.updateProgress(0);
  }

  /**
   * Retry generation
   */
  async retryGeneration() {
    console.log('Settings: Retrying generation...');
    
    // Hide current status
    this.hideGenerationStatus();
    
    // Wait a moment then retry
    setTimeout(async () => {
      try {
        const formatSelect = document.getElementById('pairing-format');
        const format = formatSelect ? formatSelect.value : 'uuid';
        await this.generatePairingCode(format);
      } catch (error) {
        console.error('Settings: Retry failed:', error);
        this.showGenerationStatus('error', 'Retry failed: ' + error.message);
      }
    }, 500);
  }


}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.settingsManager = new MylZipSettings();
});