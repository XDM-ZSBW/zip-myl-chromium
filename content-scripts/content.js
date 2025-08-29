// Myl.Zip Chromium Extension - Content Script
// Intelligent thought tracking and typing-aware assistance for web pages

class MylZipContentScript {
  constructor() {
    this.settings = null;
    this.currentThought = '';
    this.typingCount = 0;
    this.lastTypingTime = 0;
    this.typingTimer = null;
    this.analysisTimer = null;
    this.visualIndicator = null;
    this.popupOverlay = null;
    this.cursorIndicator = null;
    this.mousePosition = { x: 0, y: 0 };
    this.focusedElement = null;
    this.isTyping = false;
    this.thoughtBuffer = '';
    this.runOnThoughtScore = 0;
    this.fab = null;
    this.fabContextMenu = null;
    this.floatingOrb = null;
    this.serviceEnabled = true;
    this.apiClient = null;
    this.encryptionService = null;
    this.deviceManager = null;
    this.encryptionEnabled = true;
    
    // Comprehensive input tracking system
    this.inputHistory = [];
    this.formInteractions = new Map();
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      pageUrl: window.location.href,
      pageTitle: document.title
    };
    
    this.init();
  }

  async init() {
    console.log('Myl.Zip Content Script: Initializing...');
    
    // Clean up any existing orbs to prevent duplicates
    this.cleanupExistingOrbs();
    
    // Initialize encryption service
    try {
      this.encryptionService = new MylZipEncryptionService();
      await this.encryptionService.init();
      console.log('Myl.Zip Content Script: Encryption service initialized');
    } catch (error) {
      console.error('Myl.Zip Content Script: Failed to initialize encryption service:', error);
      this.encryptionEnabled = false;
    }
    
    // COMPLETELY DISABLED to fix extension context invalidation issues
    console.log('Myl.Zip Content Script: Device manager completely disabled to prevent extension context issues');
    this.deviceManager = null;
    
    // Also disable any background script communication that might cause issues
    this.disableBackgroundCommunication = true;
    
    // Temporarily disable API client to prevent background script communication issues
    console.log('Myl.Zip Content Script: API client disabled to prevent extension context issues');
    this.apiClient = null;
    
    // Temporarily disable settings loading to prevent background script communication issues
    console.log('Myl.Zip Content Script: Settings loading disabled to prevent extension context issues');
    this.settings = this.getDefaultSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup visual indicators
    this.setupVisualIndicators();
    
    // Setup FAB (Floating Action Button)
    this.setupFAB();
    
    // Setup sensor tracking
    this.setupSensorTracking();
    
    // Initialize thought tracking
    this.initializeThoughtTracking();
    
    console.log('Myl.Zip Content Script: Ready');
  }

  async loadSettings() {
    // Temporarily disabled to prevent extension context issues
    if (this.disableBackgroundCommunication) {
      console.log('Myl.Zip Content Script: Settings loading disabled due to background communication issues');
      this.settings = this.getDefaultSettings();
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      this.settings = response.settings;
      console.log('Settings loaded:', this.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      typingThreshold: 100,
      enableTypingIndicator: true,
      enableTypingAwareService: true,
      typingAnalysisDelay: 500,
      enablePopupOverlay: true,
      enableVisualFeedback: true,
      enableSoundFeedback: false,
      enableRunOnThoughtDetection: true,
      runOnThoughtThreshold: 50,
      enableCursorProximityIndicators: true,
      proximityIndicatorStyle: 'pulse',
      enableFloatingOrb: true,
      enableFloatingOrbFollow: false,
      floatingOrbStyle: 'default',
      responseTriggerKeywords: ['help', 'assist', 'guide', 'suggest', 'recommend'],
      enableThoughtTracking: true,
      maxThoughtLength: 1000
    };
  }

  /**
   * Check if device manager is available and working
   */
  isDeviceManagerAvailable() {
    return this.deviceManager && typeof this.deviceManager.getDeviceStatus === 'function';
  }

  /**
   * Clean up any existing orbs to prevent duplicates
   */
  cleanupExistingOrbs() {
    // Remove any existing orbs from previous instances
    const existingOrbs = document.querySelectorAll('#myl-zip-floating-orb');
    if (existingOrbs.length > 0) {
      console.log(`Myl.Zip Content Script: Found ${existingOrbs.length} existing orbs, removing them`);
      existingOrbs.forEach(orb => orb.remove());
    }
    
    // Reset the floating orb reference
    this.floatingOrb = null;
  }

  /**
   * Store thought data locally when backend is not available
   */
  async storeThoughtLocally(thoughtData) {
    try {
      // Get existing thoughts from local storage
      const existingThoughts = JSON.parse(localStorage.getItem('myl-zip-thoughts') || '[]');
      
      // Add new thought
      existingThoughts.push({
        ...thoughtData,
        id: Date.now().toString(),
        storedAt: new Date().toISOString()
      });
      
      // Keep only last 100 thoughts to prevent storage bloat
      if (existingThoughts.length > 100) {
        existingThoughts.splice(0, existingThoughts.length - 100);
      }
      
      // Save back to local storage
      localStorage.setItem('myl-zip-thoughts', JSON.stringify(existingThoughts));
      
      console.log('Myl.Zip: Thought stored locally successfully');
      
      // Send UI update to popup
      this.sendUIUpdate();
    } catch (error) {
      console.error('Myl.Zip: Failed to store thought locally:', error);
    }
  }

  /**
   * Send UI update to popup with current thought data
   */
  sendUIUpdate() {
    // Temporarily disabled to prevent extension context issues
    if (this.disableBackgroundCommunication) {
      console.log('Myl.Zip: UI update disabled due to background communication issues');
      return;
    }
    
    try {
      // Send thought data to popup
      chrome.runtime.sendMessage({
        type: 'UI_UPDATE',
        data: {
          currentThought: this.currentThought,
          typingCount: this.typingCount,
          thoughtCount: this.getLocalThoughtCount(),
          sessionStartTime: this.currentSession.startTime
        }
      }).catch(error => {
        console.log('Could not send UI update:', error);
      });
    } catch (error) {
      console.log('Error sending UI update:', error);
    }
  }

  /**
   * Get count of thoughts stored locally
   */
  getLocalThoughtCount() {
    try {
      const thoughts = JSON.parse(localStorage.getItem('myl-zip-thoughts') || '[]');
      return thoughts.length;
    } catch (error) {
      console.log('Error getting local thought count:', error);
      return 0;
    }
  }

  /**
   * Show local notification instead of using background script
   */
  showLocalNotification(title, message) {
    try {
      // Create a simple local notification element
      const notification = document.createElement('div');
      notification.className = 'myl-zip-local-notification';
      notification.innerHTML = `
        <div class="myl-zip-notification-title">${title}</div>
        <div class="myl-zip-notification-message">${message}</div>
      `;
      
      // Style the notification
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
        word-wrap: break-word;
      `;
      
      // Add to page
      document.body.appendChild(notification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
      
      console.log('Myl.Zip: Local notification shown:', title, message);
    } catch (error) {
      console.log('Myl.Zip: Failed to show local notification:', error);
    }
  }

  /**
   * Schedule a retry to start periodic sync if device registration completes later
   */
  schedulePeriodicSyncRetry() {
    if (this.periodicSyncRetryTimeout) {
      clearTimeout(this.periodicSyncRetryTimeout);
    }
    
    this.periodicSyncRetryTimeout = setTimeout(async () => {
      try {
        if (this.deviceManager && this.deviceManager.isRegistered && this.encryptionService) {
          console.log('Myl.Zip Content Script: Device registration completed, starting periodic sync');
          this.deviceManager.startPeriodicSync(async (sharedThought) => {
            try {
              // Decrypt and process shared thought
              const decryptedThought = await this.encryptionService.decryptThought(sharedThought.encryptedData);
              console.log('Myl.Zip: Received shared thought from device:', sharedThought.sourceDeviceId);
              
              // Store the shared thought locally
              await this.storeSharedThought(decryptedThought, sharedThought);
            } catch (error) {
              console.error('Myl.Zip: Failed to process shared thought:', error);
            }
          });
        } else {
          console.log('Myl.Zip Content Script: Device still not registered, scheduling another retry');
          this.schedulePeriodicSyncRetry();
        }
      } catch (error) {
        console.error('Myl.Zip Content Script: Failed to start periodic sync on retry:', error);
        // Schedule another retry
        this.schedulePeriodicSyncRetry();
      }
    }, 5000); // Retry every 5 seconds
  }

  setupEventListeners() {
    // Input events for thought tracking
    document.addEventListener('input', (event) => {
      this.handleInput(event);
      
      // Update orb position when typing in input fields
      if (this.floatingOrb && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
        this.updateFloatingOrbPosition();
      }
    }, true);

    document.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    }, true);

    document.addEventListener('keyup', (event) => {
      this.handleKeyUp(event);
    }, true);

    // Focus events
    document.addEventListener('focusin', (event) => {
      this.handleFocusIn(event);
    }, true);

    document.addEventListener('focusout', (event) => {
      this.handleFocusOut(event);
    }, true);

    // Mouse events for sensor tracking
    document.addEventListener('mousemove', (event) => {
      this.handleMouseMove(event);
    }, true);

    // Scroll events
    document.addEventListener('scroll', (event) => {
      this.handleScroll(event);
    }, true);

    // Window resize events for positioning
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Before page unload - save current thought
    window.addEventListener('beforeunload', () => {
      this.saveCurrentThought();
    });

    // Form submission events
    document.addEventListener('submit', (event) => {
      this.handleFormSubmit(event);
    }, true);

    // Change events for select elements and checkboxes
    document.addEventListener('change', (event) => {
      this.handleChange(event);
    }, true);

    // Focus events for better tracking
    document.addEventListener('focus', (event) => {
      this.handleFocus(event);
      // Update orb position when focusing on input fields
      if (this.floatingOrb && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
        this.updateFloatingOrbPosition();
      }
    }, true);

    document.addEventListener('blur', (event) => {
      this.handleBlur(event);
    }, true);

    // Message handling from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  setupVisualIndicators() {
    // Create visual indicator container
    this.visualIndicator = document.createElement('div');
    this.visualIndicator.id = 'myl-zip-visual-indicator';
    this.visualIndicator.className = 'myl-zip-indicator';
    document.body.appendChild(this.visualIndicator);

    // Create popup overlay container
    this.popupOverlay = document.createElement('div');
    this.popupOverlay.id = 'myl-zip-popup-overlay';
    this.popupOverlay.className = 'myl-zip-overlay';
    document.body.appendChild(this.popupOverlay);

    // Create cursor proximity indicator
    this.cursorIndicator = document.createElement('div');
    this.cursorIndicator.id = 'myl-zip-cursor-indicator';
    this.cursorIndicator.className = 'myl-zip-cursor-indicator';
    document.body.appendChild(this.cursorIndicator);

    // Note: Floating orb will be created after FAB setup to ensure proper positioning
  }

  setupFAB() {
    // Create FAB (Floating Action Button)
    this.fab = document.createElement('button');
    this.fab.id = 'myl-zip-fab';
    this.fab.className = 'myl-zip-fab enabled';
    this.fab.setAttribute('aria-label', 'Myl.Zip Service Control');
    this.fab.setAttribute('title', 'Click to pause/enable service, right-click for options');
    
    // Create FAB icon
    const fabIcon = document.createElement('span');
    fabIcon.className = 'myl-zip-fab-icon';
    this.fab.appendChild(fabIcon);
    
    // Create FAB tooltip
    const fabTooltip = document.createElement('div');
    fabTooltip.className = 'myl-zip-fab-tooltip';
    fabTooltip.textContent = 'Service Active - Click to pause';
    this.fab.appendChild(fabTooltip);
    
    // Create FAB context menu
    this.fabContextMenu = document.createElement('div');
    this.fabContextMenu.id = 'myl-zip-fab-context-menu';
    this.fabContextMenu.className = 'myl-zip-fab-context-menu';
    this.fabContextMenu.innerHTML = `
      <div class="myl-zip-fab-context-item" data-action="toggle-service">
        <span class="myl-zip-fab-context-icon">⏸</span>
        <span class="myl-zip-fab-context-label">Toggle Service</span>
        <span class="myl-zip-fab-context-shortcut">Ctrl+Shift+Z</span>
      </div>
      <div class="myl-zip-fab-context-item" data-action="open-settings">
        <span class="myl-zip-fab-context-icon">⚙️</span>
        <span class="myl-zip-fab-context-label">Settings</span>
        <span class="myl-zip-fab-context-shortcut">Ctrl+Shift+S</span>
      </div>
      <div class="myl-zip-fab-context-item" data-action="reset-counter">
        <span class="myl-zip-fab-context-icon">🔄</span>
        <span class="myl-zip-fab-context-label">Reset Counter</span>
        <span class="myl-zip-fab-context-shortcut">Ctrl+Shift+R</span>
      </div>
      <div class="myl-zip-fab-context-item" data-action="show-help">
        <span class="myl-zip-fab-context-icon">❓</span>
        <span class="myl-zip-fab-context-label">Help</span>
      </div>
    `;
    
    document.body.appendChild(this.fab);
    document.body.appendChild(this.fabContextMenu);
    
    // Setup FAB event listeners
    this.setupFABEventListeners();
    
    // Update FAB state
    this.updateFABState();
    
    // Create floating orb after FAB is set up (for proper positioning)
    this.setupFloatingOrb();
  }

  setupFABEventListeners() {
    // Left click - toggle service
    this.fab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleService();
    });
    
    // Right click - show context menu
    this.fab.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showFABContextMenu(e);
    });
    
    // Context menu item clicks
    this.fabContextMenu.addEventListener('click', (e) => {
      const action = e.target.closest('.myl-zip-fab-context-item')?.dataset.action;
      if (action) {
        this.handleFABContextAction(action);
        this.hideFABContextMenu();
      }
    });
    
    // Hide context menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.fab.contains(e.target) && !this.fabContextMenu.contains(e.target)) {
        this.hideFABContextMenu();
      }
    });
    
    // Hide context menu on escape key, center on Ctrl+Shift+C
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideFABContextMenu();
              } else if (e.ctrlKey && e.shiftKey && e.key === 'C') {
          // Manual center command for debugging
          if (this.fabContextMenu.classList.contains('show')) {
            this.centerFABContextMenu();
          } else if (this.floatingOrb) {
            this.centerFloatingOrb();
          }
        }
    });
  }

  toggleService() {
    this.serviceEnabled = !this.serviceEnabled;
    this.updateFABState();
    
    // Update floating orb state
    if (this.floatingOrb) {
      this.updateFloatingOrbState();
    }
    
    // Send message to background script - temporarily disabled
    if (!this.disableBackgroundCommunication) {
      chrome.runtime.sendMessage({ 
        type: 'TOGGLE_SERVICE' 
      }).catch(error => {
        console.log('Could not toggle service:', error);
      });
    } else {
      console.log('Myl.Zip: Service toggle message disabled due to background communication issues');
    }
    
    // Show notification - using local notification instead of background
    this.showLocalNotification(
      this.serviceEnabled ? 'Service Enabled' : 'Service Paused',
      this.serviceEnabled ? 'Myl.Zip is now active' : 'Myl.Zip is paused'
    );
  }

  showFABContextMenu(event) {
    // Position context menu
    const fabRect = this.fab.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Show menu first to get proper dimensions
    this.fabContextMenu.style.visibility = 'hidden';
    this.fabContextMenu.style.display = 'block';
    this.fabContextMenu.classList.add('show');
    
    // Get actual menu dimensions
    const menuRect = this.fabContextMenu.getBoundingClientRect();
    const menuWidth = menuRect.width || 200; // fallback width
    const menuHeight = menuRect.height || 150; // fallback height
    
    // Calculate initial position (above FAB, right-aligned)
    let top = fabRect.top - menuHeight - 8;
    let left = fabRect.right - menuWidth;
    
    // Adjust if menu would go off screen
    if (top < 0) {
      // Position below FAB instead
      top = fabRect.bottom + 8;
    }
    
    if (left < 0) {
      // Align to left edge of FAB
      left = fabRect.left;
    }
    
    // Ensure menu doesn't go off right edge
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - 8;
    }
    
    // Ensure menu doesn't go off bottom edge
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight - 8;
    }
    
    // Apply final position with safety margins
    const finalTop = Math.max(8, Math.min(top, viewportHeight - menuHeight - 8));
    const finalLeft = Math.max(8, Math.min(left, viewportWidth - menuWidth - 8));
    
    this.fabContextMenu.style.top = `${finalTop}px`;
    this.fabContextMenu.style.left = `${finalLeft}px`;
    this.fabContextMenu.style.visibility = 'visible';
    
    // Debug logging
    console.log('FAB Context Menu positioned:', {
      fabRect,
      menuWidth,
      menuHeight,
      viewportWidth,
      viewportHeight,
      finalTop,
      finalLeft
    });
  }

  hideFABContextMenu() {
    this.fabContextMenu.classList.remove('show');
  }

  // Fallback method to center menu on screen if positioning fails
  centerFABContextMenu() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 200; // fallback width
    const menuHeight = 150; // fallback height
    
    const centerTop = (viewportHeight - menuHeight) / 2;
    const centerLeft = (viewportWidth - menuWidth) / 2;
    
    this.fabContextMenu.style.top = `${Math.max(8, centerTop)}px`;
    this.fabContextMenu.style.left = `${Math.max(8, centerLeft)}px`;
    this.fabContextMenu.style.visibility = 'visible';
    
    console.log('FAB Context Menu centered on screen as fallback');
  }

  handleFABContextAction(action) {
    switch (action) {
      case 'toggle-service':
        this.toggleService();
        break;
      case 'open-settings':
        this.openQuickSettings();
        break;
      case 'reset-counter':
        this.resetThoughtCounter();
        break;
      case 'show-help':
        this.showHelp();
        break;
    }
  }

  updateFABState() {
    // Remove all state classes
    this.fab.classList.remove('enabled', 'disabled', 'paused');
    
    // Add appropriate state class
    if (this.serviceEnabled) {
      this.fab.classList.add('enabled');
      this.fab.querySelector('.myl-zip-fab-tooltip').textContent = 'Service Active - Click to pause';
    } else {
      this.fab.classList.add('paused');
      this.fab.querySelector('.myl-zip-fab-tooltip').textContent = 'Service Paused - Click to enable';
    }
    
    // Update context menu toggle text
    const toggleItem = this.fabContextMenu.querySelector('[data-action="toggle-service"] .myl-zip-fab-context-label');
    if (toggleItem) {
      toggleItem.textContent = this.serviceEnabled ? 'Pause Service' : 'Enable Service';
    }
  }

  showNotification(title, message) {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(74, 158, 255, 0.3);
      z-index: 2147483649;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
      <div>${message}</div>
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#myl-zip-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'myl-zip-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
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

  showHelp() {
    // Create help overlay
    const helpOverlay = document.createElement('div');
    helpOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483650;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    helpOverlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      ">
        <h2 style="margin: 0 0 16px 0; color: #4a9eff;">Myl.Zip Help</h2>
        <div style="line-height: 1.6; color: #333;">
          <h3>Floating Action Button (FAB)</h3>
          <ul>
            <li><strong>Left Click:</strong> Toggle service on/off</li>
            <li><strong>Right Click:</strong> Show context menu with all options</li>
          </ul>
          
          <h3>Keyboard Shortcuts</h3>
          <ul>
            <li><strong>Ctrl+Shift+Z:</strong> Toggle service</li>
            <li><strong>Ctrl+Shift+S:</strong> Open settings</li>
            <li><strong>Ctrl+Shift+R:</strong> Reset thought counter</li>
          </ul>
          
          <h3>Visual Indicators</h3>
          <ul>
            <li><strong>Green:</strong> Service active, low activity</li>
            <li><strong>Orange:</strong> Service active, medium activity</li>
            <li><strong>Red:</strong> Service active, high activity</li>
            <li><strong>Gray:</strong> Service paused</li>
          </ul>
        </div>
        <button onclick="this.closest('.myl-zip-help-overlay').remove()" style="
          margin-top: 16px;
          padding: 8px 16px;
          background: #4a9eff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
    
    helpOverlay.className = 'myl-zip-help-overlay';
    document.body.appendChild(helpOverlay);
    
    // Close on background click
    helpOverlay.addEventListener('click', (e) => {
      if (e.target === helpOverlay) {
        helpOverlay.remove();
      }
    });
  }

  setupSensorTracking() {
    if (!this.settings.enableMouseTracking) return;

    // Track mouse movement for attention detection
    let mouseIdleTimer = null;
    
    document.addEventListener('mousemove', () => {
      clearTimeout(mouseIdleTimer);
      mouseIdleTimer = setTimeout(() => {
        this.handleMouseIdle();
      }, 5000); // 5 seconds of inactivity
    });
  }

  initializeThoughtTracking() {
    // Find all text input elements
    const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]');
    
    textInputs.forEach(input => {
      this.setupInputTracking(input);
    });

    // Monitor for dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const inputs = node.querySelectorAll ? node.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]') : [];
            inputs.forEach(input => this.setupInputTracking(input));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupInputTracking(input) {
    // Add data attribute to track if already processed
    if (input.dataset.mylZipTracked) return;
    input.dataset.mylZipTracked = 'true';

    // Add visual feedback class
    input.classList.add('myl-zip-tracked-input');
  }

  handleInput(event) {
    if (!this.settings.enableThoughtTracking || !this.serviceEnabled) return;

    const target = event.target;
    if (!this.isTextInput(target)) return;

    // Check if this field should be excluded from tracking
    if (this.shouldExcludeField(target)) {
      console.log('Myl.Zip: Excluding sensitive field from tracking:', {
        type: target.type,
        name: target.name,
        id: target.id
      });
      return;
    }

    this.isTyping = true;
    this.typingCount++;
    this.lastTypingTime = Date.now();
    
    // Send UI update when typing count changes
    this.sendUIUpdate();

    // Update current thought
    this.currentThought = target.value || target.textContent || '';
    this.thoughtBuffer += event.data || '';

    // Capture comprehensive input data (with enhanced sanitization)
    this.captureInputData(target, event);

    // Update visual indicator
    this.updateVisualIndicator();

    // Clear existing timers
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
    }

    // Set timer to stop typing detection
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
      this.saveCurrentThought();
    }, 2000);

    // Set timer for typing analysis
    this.analysisTimer = setTimeout(() => {
      this.analyzeTypingActivity(target);
    }, this.settings.typingAnalysisDelay);

    // Send typing activity to background
    this.sendTypingActivity(target);
  }

  handleKeyDown(event) {
    // Handle special key combinations
    if (event.ctrlKey && event.shiftKey) {
      switch (event.key) {
        case 'Z':
          event.preventDefault();
          this.handleLeftHandAction();
          break;
        case 'M':
          event.preventDefault();
          this.handleRightHandAction();
          break;
        case 'S':
          event.preventDefault();
          this.openQuickSettings();
          break;
        case 'R':
          event.preventDefault();
          this.resetThoughtCounter();
          break;
      }
    }
  }

  handleKeyUp(event) {
    // Update visual indicator on key release
    if (this.isTextInput(event.target)) {
      this.updateVisualIndicator();
    }
  }

  handleFocusIn(event) {
    this.focusedElement = event.target;
    
    if (this.isTextInput(event.target)) {
      // Load previous thought for this element
      this.loadThoughtForElement(event.target);
    }
  }

  handleFocusOut(event) {
    if (this.isTextInput(event.target)) {
      // Save current thought
      this.saveCurrentThought();
    }
    
    this.focusedElement = null;
  }

  handleMouseMove(event) {
    this.mousePosition = { x: event.clientX, y: event.clientY };
    
    // Update cursor proximity indicator position
    if (this.cursorIndicator && this.cursorIndicator.style.display !== 'none' && typeof this.updateCursorIndicatorPosition === 'function') {
      this.updateCursorIndicatorPosition();
    }
  }

  updateCursorIndicatorPosition() {
    if (!this.cursorIndicator) return;
    
    // Position the cursor indicator near the mouse cursor
    const offset = 20;
    this.cursorIndicator.style.left = (this.mousePosition.x + offset) + 'px';
    this.cursorIndicator.style.top = (this.mousePosition.y + offset) + 'px';
  }

  handleScroll(event) {
    // Update visual indicators position on scroll
    this.updateVisualIndicatorPosition();
  }

  handleWindowResize() {
    // Update visual indicator position on window resize
    if (this.visualIndicator && this.visualIndicator.style.display !== 'none') {
      this.updateVisualIndicatorPosition();
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Save current thought when page becomes hidden
      this.saveCurrentThought();
    }
  }

  handleMouseIdle() {
    // Handle mouse idle state
    if (this.isTyping) {
      this.saveCurrentThought();
    }
  }

  isTextInput(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const type = element.type ? element.type.toLowerCase() : '';
    
    // Capture ALL form input elements
    return (
      // Text inputs
      tagName === 'textarea' ||
      tagName === 'input' && [
        'text', 'email', 'password', 'search', 'url', 'tel', 'number', 
        'date', 'time', 'datetime-local', 'month', 'week', 'color',
        'range', 'hidden', 'file', 'checkbox', 'radio', 'submit', 
        'reset', 'button', 'image'
      ].includes(type) ||
      // Content editable elements
      element.contentEditable === 'true' ||
      // Select elements
      tagName === 'select' ||
      // Any element with form-related attributes
      element.hasAttribute('name') ||
      element.hasAttribute('id') && element.closest('form') ||
      // Custom tracked elements
      element.classList.contains('myl-zip-tracked-input')
    );
  }

  updateVisualIndicator() {
    if (!this.settings.enableVisualFeedback || !this.visualIndicator) return;

    const length = this.currentThought.length;
    let indicatorClass = 'myl-zip-indicator-low';
    let pulseIntensity = 1;

    // If service is disabled, show disabled state
    if (!this.serviceEnabled) {
      indicatorClass = 'myl-zip-indicator-disabled';
      pulseIntensity = 0;
    } else if (length > 0) {
      if (length < 100) {
        indicatorClass = 'myl-zip-indicator-low';
        pulseIntensity = 1;
      } else if (length < 500) {
        indicatorClass = 'myl-zip-indicator-medium';
        pulseIntensity = 2;
      } else {
        indicatorClass = 'myl-zip-indicator-high';
        pulseIntensity = 3;
      }
    }

    // Update indicator class and position
    this.visualIndicator.className = `myl-zip-indicator ${indicatorClass}`;
    this.visualIndicator.style.setProperty('--pulse-intensity', pulseIntensity);
    
    // Show indicator if there's content or service is disabled
    if (length > 0 || !this.serviceEnabled) {
      this.visualIndicator.style.display = 'block';
      this.updateVisualIndicatorPosition();
    } else {
      this.visualIndicator.style.display = 'none';
    }
  }

  updateVisualIndicatorPosition() {
    if (!this.visualIndicator || this.visualIndicator.style.display === 'none') return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const indicatorWidth = 200; // Approximate width of the indicator
    const indicatorHeight = 60; // Approximate height of the indicator
    const margin = 10;

    let x, y;
    let preferredPosition = 'right'; // Default to right side

    if (this.focusedElement) {
      const rect = this.focusedElement.getBoundingClientRect();
      
      // Try different positions based on available space
      const spaceRight = viewportWidth - rect.right;
      const spaceLeft = rect.left;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Determine best position
      if (spaceRight >= indicatorWidth + margin) {
        // Position to the right of the element
        x = rect.right + margin;
        y = rect.top;
        preferredPosition = 'right';
      } else if (spaceLeft >= indicatorWidth + margin) {
        // Position to the left of the element
        x = rect.left - indicatorWidth - margin;
        y = rect.top;
        preferredPosition = 'left';
      } else if (spaceBelow >= indicatorHeight + margin) {
        // Position below the element
        x = rect.left;
        y = rect.bottom + margin;
        preferredPosition = 'below';
      } else if (spaceAbove >= indicatorHeight + margin) {
        // Position above the element
        x = rect.left;
        y = rect.top - indicatorHeight - margin;
        preferredPosition = 'above';
      } else {
        // Fallback: position in center of viewport
        x = (viewportWidth - indicatorWidth) / 2;
        y = (viewportHeight - indicatorHeight) / 2;
        preferredPosition = 'center';
      }
    } else {
      // No focused element, use mouse position with viewport constraints
      x = this.mousePosition.x;
      y = this.mousePosition.y;
      
      // Adjust if too close to edges
      if (x + indicatorWidth + margin > viewportWidth) {
        x = viewportWidth - indicatorWidth - margin;
      }
      if (y + indicatorHeight + margin > viewportHeight) {
        y = viewportHeight - indicatorHeight - margin;
      }
      if (x < margin) x = margin;
      if (y < margin) y = margin;
    }

    // Final viewport boundary check
    x = Math.max(margin, Math.min(x, viewportWidth - indicatorWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - indicatorHeight - margin));

    this.visualIndicator.style.left = `${x}px`;
    this.visualIndicator.style.top = `${y}px`;
    
    // Add a class to indicate the position for potential styling adjustments
    this.visualIndicator.className = this.visualIndicator.className.replace(/position-\w+/g, '');
    this.visualIndicator.classList.add(`position-${preferredPosition}`);
    
    // Debug logging (can be removed in production)
    if (this.settings && this.settings.debugMode) {
      console.log(`Myl.Zip: Indicator positioned at (${x}, ${y}) using ${preferredPosition} position`);
    }
  }

  async analyzeTypingActivity(target) {
    if (!this.settings.enableTypingAwareService) return;

    const text = target.value || target.textContent || '';
    const analysis = this.performTypingAnalysis(text, target);

    if (analysis.needsAttention) {
      await this.triggerAttentionResponse(analysis);
    }

    // Check for run-on thoughts
    if (this.settings.enableRunOnThoughtDetection) {
      this.checkRunOnThoughts(text, target);
    }
  }

  performTypingAnalysis(text, target) {
    const textLower = text.toLowerCase();
    const hasTriggerKeywords = this.settings.responseTriggerKeywords.some(keyword => 
      textLower.includes(keyword.toLowerCase())
    );

    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = text.length;

    const needsAttention = hasTriggerKeywords || 
      wordCount > 20 || 
      characterCount > 100 ||
      textLower.includes('?') ||
      textLower.includes('!');

    return {
      hasTriggerKeywords,
      needsAttention,
      wordCount,
      characterCount,
      confidence: hasTriggerKeywords ? 0.8 : 0.6,
      context: hasTriggerKeywords ? 'keyword-trigger' : 'long-text',
      suggestedResponse: this.generateSuggestedResponse(text, hasTriggerKeywords)
    };
  }

  generateSuggestedResponse(text, hasTriggerKeywords) {
    if (hasTriggerKeywords) {
      if (text.toLowerCase().includes('help')) {
        return 'I can help you with that! What specific assistance do you need?';
      } else if (text.toLowerCase().includes('assist')) {
        return 'I\'m here to assist you. Let me know what you\'d like to work on.';
      } else if (text.toLowerCase().includes('guide')) {
        return 'I can guide you through this process. What would you like to accomplish?';
      } else if (text.toLowerCase().includes('suggest')) {
        return 'I have some suggestions for you. Would you like to hear them?';
      } else if (text.toLowerCase().includes('recommend')) {
        return 'I can recommend some approaches. What are you trying to achieve?';
      }
      return 'I noticed you might need some help. How can I assist you?';
    } else if (text.length > 100) {
      return 'Consider breaking this into smaller, focused sections.';
    } else if (text.includes('?')) {
      return 'This looks like a question. Would you like me to help you find an answer?';
    }
    return 'Keep up the great work!';
  }

  checkRunOnThoughts(text, target) {
    this.runOnThoughtScore = this.calculateRunOnThoughtScore(text);
    
    if (this.runOnThoughtScore > this.settings.runOnThoughtThreshold) {
      this.showCursorProximityIndicator(target);
    }
  }

  calculateRunOnThoughtScore(text) {
    let score = 0;
    
    // Long sentences (more than 20 words)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length > 20) score += 30;
    
    // Very long lines (more than 100 characters)
    if (text.length > 100) score += 25;
    
    // Multiple clauses without proper punctuation
    const clauses = text.split(/[.!?]/).filter(clause => clause.trim().length > 0);
    if (clauses.length > 3) score += 20;
    
    // Excessive use of conjunctions
    const conjunctions = (text.match(/\b(and|or|but|however|therefore|furthermore|moreover|additionally)\b/gi) || []).length;
    if (conjunctions > 2) score += 15;
    
    // Lack of paragraph breaks (very long continuous text)
    if (this.thoughtBuffer.length > 200) score += 20;
    
    return Math.min(score, 100); // Cap at 100
  }

  showCursorProximityIndicator(target) {
    if (!this.settings.enableCursorProximityIndicators || !this.cursorIndicator) return;

    const severity = this.runOnThoughtScore > 70 ? 'high' : this.runOnThoughtScore > 40 ? 'medium' : 'low';
    
    this.cursorIndicator.className = `myl-zip-cursor-indicator myl-zip-severity-${severity} myl-zip-indicator-${this.settings.proximityIndicatorStyle}`;
    this.cursorIndicator.innerHTML = `
      <div class="myl-zip-indicator-content">
        <div class="myl-zip-indicator-icon">⚠️</div>
        <div class="myl-zip-indicator-text">Run-on Thought Detected</div>
        <div class="myl-zip-indicator-score">${this.runOnThoughtScore}%</div>
      </div>
    `;

    // Position indicator near target element
    const rect = target.getBoundingClientRect();
    this.cursorIndicator.style.left = `${rect.right + 10}px`;
    this.cursorIndicator.style.top = `${rect.top}px`;
    this.cursorIndicator.style.display = 'block';

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.cursorIndicator.style.display = 'none';
    }, 3000);
  }

  async triggerAttentionResponse(analysis) {
    if (this.settings.enablePopupOverlay) {
      await this.showPopupOverlay(analysis);
    }

    if (this.settings.enableSoundFeedback) {
      this.playAttentionSound();
    }
  }

  async showPopupOverlay(analysis) {
    if (!this.popupOverlay) return;

    const confidenceColor = analysis.confidence > 0.7 ? '#4CAF50' : 
                           analysis.confidence > 0.5 ? '#FF9800' : '#F44336';

    this.popupOverlay.innerHTML = `
      <div class="myl-zip-overlay-header">
        <div class="myl-zip-overlay-icon">🎯</div>
        <div class="myl-zip-overlay-title">Myl.Zip Assistant</div>
        <div class="myl-zip-overlay-close" onclick="this.parentElement.parentElement.style.display='none'">×</div>
      </div>
      <div class="myl-zip-overlay-content">
        <div class="myl-zip-overlay-context">
          <strong>Context:</strong> ${analysis.context}
        </div>
        <div class="myl-zip-overlay-confidence">
          <strong>Confidence:</strong> 
          <span style="color: ${confidenceColor}">${Math.round(analysis.confidence * 100)}%</span>
        </div>
        <div class="myl-zip-overlay-suggestion">
          <strong>Suggestion:</strong><br>
          ${analysis.suggestedResponse}
        </div>
      </div>
      <div class="myl-zip-overlay-actions">
        <button class="myl-zip-overlay-btn myl-zip-overlay-btn-primary" onclick="this.closest('.myl-zip-overlay').style.display='none'">
          Got it!
        </button>
        <button class="myl-zip-overlay-btn myl-zip-overlay-btn-secondary" onclick="this.closest('.myl-zip-overlay').style.display='none'">
          Ignore
        </button>
      </div>
    `;

    // Position overlay near focused element
    if (this.focusedElement) {
      const rect = this.focusedElement.getBoundingClientRect();
      this.popupOverlay.style.left = `${rect.left}px`;
      this.popupOverlay.style.top = `${rect.bottom + 10}px`;
    } else {
      this.popupOverlay.style.left = `${this.mousePosition.x}px`;
      this.popupOverlay.style.top = `${this.mousePosition.y}px`;
    }

    this.popupOverlay.style.display = 'block';

    // Auto-hide after duration
    setTimeout(() => {
      this.popupOverlay.style.display = 'none';
    }, this.settings.overlayAnimationDuration || 3000);
  }

  playAttentionSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Could not play attention sound:', error);
    }
  }

  async sendTypingActivity(target) {
    if (!this.apiClient) {
      console.log('Myl.Zip: API client not available, attempting to reinitialize...');
      try {
        await this.reinitializeAPIClient();
        if (!this.apiClient) {
          console.warn('Myl.Zip: Failed to reinitialize API client, skipping typing activity');
          return;
        }
      } catch (error) {
        console.warn('Myl.Zip: Could not reinitialize API client, skipping typing activity:', error);
        return;
      }
    }

    // Check if we should skip this request due to backend being offline
    if (this.apiClient.shouldSkipRequest && this.apiClient.shouldSkipRequest()) {
      console.log('Myl.Zip: Skipping typing activity - backend has been offline for extended period');
      this.updateConnectionStatus('offline');
      return;
    }

    try {
      const activityData = {
        text: target.value || target.textContent || '',
        wordCount: (target.value || target.textContent || '').trim().split(/\s+/).filter(word => word.length > 0).length,
        characterCount: (target.value || target.textContent || '').length,
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        element: {
          tagName: target.tagName,
          type: target.type,
          id: target.id,
          className: target.className
        }
      };

      // Encrypt the thought data if encryption is enabled and service is properly initialized
      let encryptedData = null;
      if (this.encryptionEnabled && this.encryptionService && typeof this.encryptionService.encryptThought === 'function') {
        try {
          encryptedData = await this.encryptionService.encryptThought(activityData);
          console.log('Myl.Zip: Thought encrypted successfully');
        } catch (encryptError) {
          console.error('Myl.Zip: Failed to encrypt thought:', encryptError);
          // Continue without encryption if encryption fails
        }
      } else {
        console.log('Myl.Zip: Encryption service not available or not properly initialized');
      }

      // Send to backend API only if available and background communication is enabled
      if (this.apiClient && !this.disableBackgroundCommunication) {
        let result;
        if (encryptedData) {
          // Use encrypted endpoint
          result = await this.apiClient.saveEncryptedThought(encryptedData, activityData);
        } else {
          // Use regular endpoint
          result = await this.apiClient.saveThought(activityData.text, activityData);
        }
        
        if (result && result.success) {
          console.log('Myl.Zip: Thought saved to backend successfully');
          this.updateConnectionStatus('connected');
          
          // Share with trusted devices if encryption is enabled
          if (this.encryptionEnabled && this.deviceManager && encryptedData) {
            await this.shareWithTrustedDevices(encryptedData);
          }
        } else {
          console.warn('Myl.Zip: Failed to save thought to backend:', result?.message || 'Unknown error');
          this.updateConnectionStatus('error');
        }
      } else {
        console.log('Myl.Zip: API client not available or background communication disabled, thought stored locally only');
        // Store locally only
        await this.storeThoughtLocally(activityData);
      }
    } catch (error) {
      console.error('Myl.Zip: Error sending typing activity:', error);
      
      // Check if it's a context invalidation error
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.warn('Myl.Zip: Extension context invalidated, attempting to reinitialize API client');
        this.reinitializeAPIClient();
      } else if (error.message && error.message.includes('Failed to fetch')) {
        console.warn('Myl.Zip: Backend connection failed - make sure backend is running at http://localhost:3000');
        this.updateConnectionStatus('offline');
      } else {
        this.updateConnectionStatus('error');
      }
    }
  }

  isExtensionPage() {
    // Check if we're running on an extension page (not external websites)
    const currentUrl = window.location.href;
    const isExtensionPage = currentUrl.startsWith('chrome-extension://') || 
                           currentUrl.startsWith('chrome://') ||
                           currentUrl.startsWith('moz-extension://');
    
    return isExtensionPage;
  }

  async reinitializeAPIClient() {
    // Completely disabled to prevent extension context issues
    console.log('Myl.Zip: API client reinitialization disabled to prevent extension context issues');
    this.apiClient = null;
  }

  updateConnectionStatus(status) {
    // Allow UI updates even when background communication is disabled
    if (this.disableBackgroundCommunication && status !== 'ui_update') {
      console.log('Myl.Zip Content Script: Connection status update disabled due to background communication issues');
      return;
    }
    
    // Send connection status to background script for popup display
    chrome.runtime.sendMessage({
      type: 'CONNECTION_STATUS_UPDATE',
      status: status,
      timestamp: Date.now()
    }).catch(error => {
      console.log('Could not send connection status:', error);
    });
  }

  async saveCurrentThought() {
    if (!this.currentThought || !this.settings.enableThoughtTracking) {
      console.log('Myl.Zip: Skipping save - no thought or tracking disabled');
      return;
    }

    // Backend communication disabled, proceeding with local storage only

    try {
      const thoughtData = {
        text: this.currentThought,
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        typingCount: this.typingCount,
        thoughtBuffer: this.thoughtBuffer
      };

      // Encrypt the thought data if encryption is enabled and service is properly initialized
      let encryptedData = null;
      if (this.encryptionEnabled && this.encryptionService && typeof this.encryptionService.encryptThought === 'function') {
        try {
          encryptedData = await this.encryptionService.encryptThought(thoughtData);
          console.log('Myl.Zip: Current thought encrypted successfully');
        } catch (encryptError) {
          console.error('Myl.Zip: Failed to encrypt current thought:', encryptError);
          // Continue without encryption if encryption fails
        }
      } else {
        console.log('Myl.Zip: Encryption service not available or not properly initialized');
      }

      // Send to backend API only if available and background communication is enabled
      if (this.apiClient && !this.disableBackgroundCommunication) {
        let result;
        if (encryptedData) {
          // Use encrypted endpoint
          result = await this.apiClient.saveEncryptedThought(encryptedData, thoughtData);
        } else {
          // Use regular endpoint
          result = await this.apiClient.saveThought(this.currentThought, thoughtData);
        }
        
        if (result && result.success) {
          console.log('Myl.Zip: Current thought saved to backend successfully');
          
          // Share with trusted devices if encryption is enabled
          if (this.encryptionEnabled && this.deviceManager && encryptedData) {
            await this.shareWithTrustedDevices(encryptedData);
          }
        } else {
          console.warn('Myl.Zip: Failed to save current thought to backend:', result?.message || 'Unknown error');
        }
      } else {
        console.log('Myl.Zip: API client not available or background communication disabled, thought stored locally only');
        // Store locally only
        await this.storeThoughtLocally(thoughtData);
      }
    } catch (error) {
      console.error('Myl.Zip: Error saving current thought:', error);
      
      if (error.message && error.message.includes('Failed to fetch')) {
        console.warn('Myl.Zip: Backend connection failed - make sure backend is running at http://localhost:3000');
      }
    }
  }

  async loadThoughtForElement(element) {
    // Temporarily disabled to prevent extension context issues
    if (this.disableBackgroundCommunication) {
      console.log('Myl.Zip: Loading thought from background disabled due to communication issues');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_THOUGHT' });
      if (response.thought && response.thought.text) {
        // Restore thought to element if it's empty
        if (!element.value && !element.textContent) {
          if (element.tagName.toLowerCase() === 'textarea' || element.type === 'text') {
            element.value = response.thought.text;
          } else if (element.contentEditable === 'true') {
            element.textContent = response.thought.text;
          }
        }
      }
    } catch (error) {
      console.log('Could not load thought:', error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'GET_CURRENT_THOUGHT':
          sendResponse({ thought: { text: this.currentThought, url: window.location.href, title: document.title } });
          break;

        case 'GET_TYPING_STATS':
          // Provide typing stats directly from content script
          sendResponse({ 
            typingCount: this.typingCount, 
            thoughtCount: this.getLocalThoughtCount(),
            sessionStartTime: this.currentSession.startTime
          });
          break;

        case 'LOAD_THOUGHT':
          if (message.thought && this.focusedElement) {
            this.loadThoughtForElement(this.focusedElement);
          }
          sendResponse({ success: true });
          break;

        case 'SHOW_ATTENTION_OVERLAY':
          await this.showPopupOverlay(message.analysis);
          sendResponse({ success: true });
          break;

        case 'SERVICE_TOGGLED':
          this.settings.enableTypingAwareService = message.enabled;
          this.serviceEnabled = message.enabled;
          this.updateFABState();
          
          // Update floating orb state
          if (this.floatingOrb) {
            this.updateFloatingOrbState();
          }
          
          sendResponse({ success: true });
          break;

        case 'SETTINGS_UPDATED':
          this.settings = { ...this.settings, ...message.settings };
          
          // Handle floating orb setting changes
          if (message.settings.enableFloatingOrb !== undefined) {
            if (message.settings.enableFloatingOrb && !this.floatingOrb) {
              // Create floating orb if it was disabled and now enabled
              this.setupFloatingOrb();
            } else if (!message.settings.enableFloatingOrb && this.floatingOrb) {
              // Remove floating orb if it was enabled and now disabled
              this.floatingOrb.remove();
              this.floatingOrb = null;
            }
          }
          
          // Update floating orb state if it exists
          if (this.floatingOrb) {
            this.updateFloatingOrbState();
          }
          
          sendResponse({ success: true });
          break;

        case 'SHARED_THOUGHT_RECEIVED':
          await this.handleSharedThought(message.thought);
          sendResponse({ success: true });
          break;

        case 'GET_ENCRYPTION_STATUS':
          const encryptionStatus = await this.getEncryptionStatus();
          sendResponse({ success: true, status: encryptionStatus });
          break;

        case 'REGISTER_DEVICE':
          try {
            const result = await this.registerDevice(message.deviceInfo);
            sendResponse({ success: true, device: result });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'GET_TRUSTED_DEVICES':
          try {
            const devices = await this.getTrustedDevices();
            sendResponse({ success: true, devices: devices });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'GENERATE_PAIRING_CODE':
          try {
            const pairingCode = await this.generatePairingCode();
            sendResponse({ success: true, pairingCode: pairingCode });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'VERIFY_PAIRING_CODE':
          try {
            const result = await this.verifyPairingCode(message.pairingCode);
            sendResponse({ success: result, message: result ? 'Pairing code verified successfully' : 'Pairing code verification failed' });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'REMOVE_TRUSTED_DEVICE':
          try {
            const result = await this.removeTrustedDevice(message.deviceId);
            sendResponse({ success: result, message: result ? 'Device removed successfully' : 'Failed to remove device' });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'SETUP_ENCRYPTION':
          try {
            const result = await this.setupEncryption(message.password);
            sendResponse({ success: result, message: result ? 'Encryption setup completed' : 'Encryption setup failed' });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'CLEAR_DEVICE_DATA':
          try {
            await this.clearDeviceData();
            sendResponse({ success: true, message: 'Device data cleared successfully' });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  // Action handlers
  handleLeftHandAction() {
    console.log('Left Hand Action: Quick breather space activated');
    this.resetThoughtCounter();
  }

  handleRightHandAction() {
    console.log('Right Hand Action: Focus mode activated');
    this.updateVisualIndicator();
  }

  async openQuickSettings() {
    // Temporarily disabled to prevent extension context issues
    if (this.disableBackgroundCommunication) {
      console.log('Myl.Zip: Quick settings disabled due to background communication issues');
      return;
    }
    
    try {
      await chrome.runtime.sendMessage({ type: 'SHOW_NOTIFICATION', title: 'Myl.Zip', message: 'Opening quick settings...' });
    } catch (error) {
      console.log('Could not open quick settings:', error);
    }
  }

  async resetThoughtCounter() {
    this.currentThought = '';
    this.typingCount = 0;
    this.thoughtBuffer = '';
    this.updateVisualIndicator();
    
    // Show local notification instead of background message
    this.showLocalNotification('Thought Counter Reset', 'Thought counter has been reset');
  }

  async shareWithTrustedDevices(encryptedThought) {
    try {
      if (!this.deviceManager) {
        console.log('Myl.Zip: Device manager not available for sharing');
        return;
      }

      const trustedDevices = await this.deviceManager.getTrustedDevices();
      if (trustedDevices.length === 0) {
        console.log('Myl.Zip: No trusted devices available for sharing');
        return;
      }

      // Share with all trusted devices
      for (const device of trustedDevices) {
        try {
          await this.deviceManager.shareThoughtWithDevice(encryptedThought, device.deviceId);
          console.log('Myl.Zip: Thought shared with device:', device.deviceName);
        } catch (shareError) {
          console.error('Myl.Zip: Failed to share with device:', device.deviceName, shareError);
        }
      }
    } catch (error) {
      console.error('Myl.Zip: Failed to share with trusted devices:', error);
    }
  }

  async handleSharedThought(sharedThought) {
    try {
      console.log('Myl.Zip: Received shared thought from:', sharedThought.sharedBy);
      
      // Show notification about shared thought
      this.showNotification(
        'Shared Thought Received',
        `New thought from ${sharedThought.sharedBy}`
      );
      
      // Optionally display the shared thought in a popup
      if (this.settings.enablePopupOverlay) {
        await this.showSharedThoughtOverlay(sharedThought);
      }
    } catch (error) {
      console.error('Myl.Zip: Failed to handle shared thought:', error);
    }
  }

  async showSharedThoughtOverlay(sharedThought) {
    try {
      if (!this.popupOverlay) return;

      this.popupOverlay.innerHTML = `
        <div class="myl-zip-overlay-header">
          <div class="myl-zip-overlay-icon">🔗</div>
          <div class="myl-zip-overlay-title">Shared Thought</div>
          <div class="myl-zip-overlay-close" onclick="this.parentElement.parentElement.style.display='none'">×</div>
        </div>
        <div class="myl-zip-overlay-content">
          <div class="myl-zip-overlay-context">
            <strong>From:</strong> ${sharedThought.sharedBy}
          </div>
          <div class="myl-zip-overlay-thought">
            <strong>Thought:</strong><br>
            ${sharedThought.text}
          </div>
          <div class="myl-zip-overlay-meta">
            <strong>URL:</strong> ${sharedThought.url}<br>
            <strong>Time:</strong> ${new Date(sharedThought.timestamp).toLocaleString()}
          </div>
        </div>
        <div class="myl-zip-overlay-actions">
          <button class="myl-zip-overlay-btn myl-zip-overlay-btn-primary" onclick="this.closest('.myl-zip-overlay').style.display='none'">
            Got it!
          </button>
          <button class="myl-zip-overlay-btn myl-zip-overlay-btn-secondary" onclick="this.closest('.myl-zip-overlay').style.display='none'">
            Dismiss
          </button>
        </div>
      `;

      // Position overlay near focused element or center of screen
      if (this.focusedElement) {
        const rect = this.focusedElement.getBoundingClientRect();
        this.popupOverlay.style.left = `${rect.left}px`;
        this.popupOverlay.style.top = `${rect.bottom + 10}px`;
      } else {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const overlayWidth = 400; // Approximate width
        const overlayHeight = 300; // Approximate height
        
        this.popupOverlay.style.left = `${(viewportWidth - overlayWidth) / 2}px`;
        this.popupOverlay.style.top = `${(viewportHeight - overlayHeight) / 2}px`;
      }

      this.popupOverlay.style.display = 'block';

      // Auto-hide after 10 seconds
      setTimeout(() => {
        this.popupOverlay.style.display = 'none';
      }, 10000);
    } catch (error) {
      console.error('Myl.Zip: Failed to show shared thought overlay:', error);
    }
  }

  async getEncryptionStatus() {
    try {
      if (!this.encryptionService) {
        return {
          enabled: false,
          initialized: false,
          hasKeys: false,
          trustedDevicesCount: 0
        };
      }

      const status = await this.encryptionService.getEncryptionStatus();
      return {
        enabled: this.encryptionEnabled,
        initialized: status.isInitialized,
        hasKeys: status.hasMasterKey && status.hasDeviceKey,
        trustedDevicesCount: status.trustedDevicesCount,
        deviceId: status.deviceId,
        deviceName: status.deviceName
      };
    } catch (error) {
      console.error('Myl.Zip: Failed to get encryption status:', error);
      return {
        enabled: false,
        initialized: false,
        hasKeys: false,
        trustedDevicesCount: 0
      };
    }
  }

  async generatePairingCode() {
    try {
      if (!this.encryptionService) {
        throw new Error('Encryption service not available');
      }

      const pairingCode = await this.encryptionService.generatePairingCode();
      console.log('Myl.Zip: Generated pairing code');
      return pairingCode;
    } catch (error) {
      console.error('Myl.Zip: Failed to generate pairing code:', error);
      throw error;
    }
  }

  async processPairingCode(pairingCode) {
    try {
      if (!this.encryptionService || !this.deviceManager) {
        throw new Error('Encryption service or device manager not available');
      }

      const trustedDevice = await this.encryptionService.processPairingCode(pairingCode);
      await this.deviceManager.addTrustedDevice(trustedDevice);
      
      console.log('Myl.Zip: Processed pairing code for device:', trustedDevice.deviceName);
      return trustedDevice;
    } catch (error) {
      console.error('Myl.Zip: Failed to process pairing code:', error);
      throw error;
    }
  }

  async getTrustedDevices() {
    try {
      if (!this.deviceManager) {
        return [];
      }
      return await this.deviceManager.getTrustedDevices();
    } catch (error) {
      console.error('Myl.Zip: Failed to get trusted devices:', error);
      return [];
    }
  }

  async registerDevice(deviceInfo) {
    try {
      if (!this.deviceManager) {
        throw new Error('Device manager not available');
      }
      
      console.log('Myl.Zip: Registering device with info:', deviceInfo);
      const result = await this.deviceManager.registerDevice(deviceInfo);
      console.log('Myl.Zip: Device registered successfully:', result);
      return result;
    } catch (error) {
      console.error('Myl.Zip: Failed to register device:', error);
      throw error;
    }
  }

  async verifyPairingCode(pairingCode) {
    try {
      if (!this.deviceManager) {
        throw new Error('Device manager not available');
      }
      return await this.deviceManager.verifyPairingCode(pairingCode);
    } catch (error) {
      console.error('Myl.Zip: Failed to verify pairing code:', error);
      return false;
    }
  }

  async removeTrustedDevice(deviceId) {
    try {
      if (!this.deviceManager) {
        throw new Error('Device manager not available');
      }
      return await this.deviceManager.removeTrustedDevice(deviceId);
    } catch (error) {
      console.error('Myl.Zip: Failed to remove trusted device:', error);
      return false;
    }
  }

  async setupEncryption(password) {
    try {
      if (!this.encryptionService) {
        throw new Error('Encryption service not available');
      }
      return await this.encryptionService.setupEncryption(password);
    } catch (error) {
      console.error('Myl.Zip: Failed to setup encryption:', error);
      return false;
    }
  }

  async clearDeviceData() {
    try {
      if (this.deviceManager) {
        await this.deviceManager.clearDeviceData();
      }
      if (this.encryptionService) {
        await this.encryptionService.clearEncryptionData();
      }
      console.log('Myl.Zip: Device data cleared successfully');
    } catch (error) {
      console.error('Myl.Zip: Failed to clear device data:', error);
      throw error;
    }
  }

  // ===== ENHANCED FORM EVENT HANDLERS =====

  /**
   * Handle form submission events
   */
  handleFormSubmit(event) {
    try {
      const form = event.target;
      if (!form || form.tagName.toLowerCase() !== 'form') return;

      const formData = {
        // Session information
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
        dateTime: new Date().toISOString(),
        
        // Page information
        pageUrl: window.location.href,
        pageTitle: document.title,
        domain: window.location.hostname,
        path: window.location.pathname,
        
        // Form information
        formId: form.id || 'N/A',
        formAction: form.action || 'N/A',
        formMethod: form.method || 'N/A',
        formName: form.name || 'N/A',
        
        // Event information
        eventType: 'form_submit',
        eventData: 'Form submitted',
        
        // Form fields summary
        fieldCount: form.elements.length,
        fieldTypes: this.getFormFieldTypes(form),
        
        // Browser context
        userAgent: navigator.userAgent,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };

      // Store form submission data
      this.storeInputData(formData);
      this.sendInputDataToBackground(formData);
      
    } catch (error) {
      console.error('Myl.Zip: Error handling form submit:', error);
    }
  }

  /**
   * Handle change events (select, checkbox, radio)
   */
  handleChange(event) {
    try {
      const target = event.target;
      if (!this.isTextInput(target)) return;

      // Check if this field should be excluded from tracking
      if (this.shouldExcludeField(target)) {
        console.log('Myl.Zip: Excluding sensitive field from change tracking:', {
          type: target.type,
          name: target.name,
          id: target.id
        });
        return;
      }

      // Create change event data
      const changeData = {
        // Session information
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
        dateTime: new Date().toISOString(),
        
        // Page information
        pageUrl: window.location.href,
        pageTitle: document.title,
        domain: window.location.hostname,
        path: window.location.pathname,
        
        // Element information
        elementTag: target.tagName.toLowerCase(),
        elementType: target.type || 'N/A',
        elementId: target.id || 'N/A',
        elementName: target.name || 'N/A',
        elementClass: target.className || 'N/A',
        
        // Form context
        formId: target.closest('form')?.id || 'N/A',
        formAction: target.closest('form')?.action || 'N/A',
        formMethod: target.closest('form')?.method || 'N/A',
        
        // Change information
        eventType: 'change',
        eventData: 'Element value changed',
        oldValue: target.dataset.mylZipOldValue || 'N/A',
        newValue: this.sanitizeInputValue(target, target.value || target.textContent || ''),
        
        // Browser context
        userAgent: navigator.userAgent,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };

      // Store old value for next change
      target.dataset.mylZipOldValue = target.value || target.textContent || '';

      // Store change data
      this.storeInputData(changeData);
      this.sendInputDataToBackground(changeData);
      
    } catch (error) {
      console.error('Myl.Zip: Error handling change event:', error);
    }
  }

  /**
   * Handle focus events
   */
  handleFocus(event) {
    try {
      const target = event.target;
      if (!this.isTextInput(target)) return;

      // Check if this field should be excluded from tracking
      if (this.shouldExcludeField(target)) {
        console.log('Myl.Zip: Excluding sensitive field from focus tracking:', {
          type: target.type,
          name: target.name,
          id: target.id
        });
        return;
      }

      // Create focus event data
      const focusData = {
        // Session information
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
        dateTime: new Date().toISOString(),
        
        // Page information
        pageUrl: window.location.href,
        pageTitle: document.title,
        domain: window.location.hostname,
        path: window.location.pathname,
        
        // Element information
        elementTag: target.tagName.toLowerCase(),
        elementType: target.type || 'N/A',
        elementId: target.id || 'N/A',
        elementName: target.name || 'N/A',
        elementClass: target.className || 'N/A',
        
        // Event information
        eventType: 'focus',
        eventData: 'Element focused',
        
        // Position information
        elementPosition: this.getElementPosition(target),
        viewportPosition: this.getViewportPosition(target),
        
        // Browser context
        userAgent: navigator.userAgent,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };

      // Store focus data
      this.storeInputData(focusData);
      this.sendInputDataToBackground(focusData);
      
    } catch (error) {
      console.error('Myl.Zip: Error handling focus event:', error);
    }
  }

  /**
   * Handle blur events
   */
  handleBlur(event) {
    try {
      const target = event.target;
      if (!this.isTextInput(target)) return;

      // Check if this field should be excluded from tracking
      if (this.shouldExcludeField(target)) {
        console.log('Myl.Zip: Excluding sensitive field from blur tracking:', {
          type: target.type,
          name: target.name,
          id: target.id
        });
        return;
      }

      // Create blur event data
      const blurData = {
        // Session information
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
        dateTime: new Date().toISOString(),
        
        // Page information
        pageUrl: window.location.href,
        pageTitle: document.title,
        domain: window.location.hostname,
        path: window.location.pathname,
        
        // Element information
        elementTag: target.tagName.toLowerCase(),
        elementType: target.type || 'N/A',
        elementId: target.id || 'N/A',
        elementName: target.name || 'N/A',
        elementClass: target.className || 'N/A',
        
        // Event information
        eventType: 'blur',
        eventData: 'Element blurred',
        finalValue: this.sanitizeInputValue(target, target.value || target.textContent || ''),
        
        // Position information
        elementPosition: this.getElementPosition(target),
        viewportPosition: this.getViewportPosition(target),
        
        // Browser context
        userAgent: navigator.userAgent,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };

      // Store blur data
      this.storeInputData(blurData);
      this.sendInputDataToBackground(blurData);
      
    } catch (error) {
      console.error('Myl.Zip: Error handling blur event:', error);
    }
  }

  /**
   * Get form field types summary
   */
  getFormFieldTypes(form) {
    const types = {};
    for (let element of form.elements) {
      const type = element.type || element.tagName.toLowerCase();
      types[type] = (types[type] || 0) + 1;
    }
    return types;
  }

  // ===== COMPREHENSIVE INPUT TRACKING SYSTEM =====

  /**
   * Generate a unique session ID for tracking
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Capture comprehensive input data for tabular storage
   */
  captureInputData(element, event) {
    try {
      const inputData = {
        // Session information
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
        dateTime: new Date().toISOString(),
        
        // Page information
        pageUrl: window.location.href,
        pageTitle: document.title,
        domain: window.location.hostname,
        path: window.location.pathname,
        
        // Element information
        elementTag: element.tagName.toLowerCase(),
        elementType: element.type || 'N/A',
        elementId: element.id || 'N/A',
        elementName: element.name || 'N/A',
        elementClass: element.className || 'N/A',
        elementPlaceholder: element.placeholder || 'N/A',
        
        // Form context
        formId: element.closest('form')?.id || 'N/A',
        formAction: element.closest('form')?.action || 'N/A',
        formMethod: element.closest('form')?.method || 'N/A',
        
        // Input value and metadata
        inputValue: this.sanitizeInputValue(element, element.value || element.textContent || ''),
        inputLength: (element.value || element.textContent || '').length,
        wordCount: (element.value || element.textContent || '').trim().split(/\s+/).filter(word => word.length > 0).length,
        
        // Data classification
        dataClassification: this.classifyData(element, element.value || element.textContent || ''),
        isSensitive: this.isPasswordField(element) || this.isPIIField(element),
        isExcluded: this.shouldExcludeField(element),
        
        // Event information
        eventType: event.type,
        eventData: event.data || 'N/A',
        keyCode: event.keyCode || 'N/A',
        key: event.key || 'N/A',
        
        // Position information
        elementPosition: this.getElementPosition(element),
        viewportPosition: this.getViewportPosition(element),
        
        // Additional metadata
        isContentEditable: element.contentEditable === 'true',
        isRequired: element.required || false,
        isDisabled: element.disabled || false,
        isReadOnly: element.readOnly || false,
        maxLength: element.maxLength || 'N/A',
        minLength: element.minLength || 'N/A',
        
        // Browser context
        userAgent: navigator.userAgent,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollPosition: { x: window.scrollX, y: window.scrollY }
      };

      // Add to input history
      this.inputHistory.push(inputData);
      
      // Update form interactions map
      const elementKey = this.getElementKey(element);
      if (!this.formInteractions.has(elementKey)) {
        this.formInteractions.set(elementKey, {
          element: element,
          interactions: [],
          firstInteraction: Date.now(),
          lastInteraction: Date.now()
        });
      }
      
      const interaction = this.formInteractions.get(elementKey);
      interaction.interactions.push(inputData);
      interaction.lastInteraction = Date.now();
      
      // Store in Chrome storage for persistence
      this.storeInputData(inputData);
      
      // Send to background script for processing
      this.sendInputDataToBackground(inputData);
      
    } catch (error) {
      console.error('Myl.Zip: Error capturing input data:', error);
    }
  }

  /**
   * Sanitize input value to remove sensitive data
   */
  sanitizeInputValue(element, value) {
    if (!value) return '';
    
    // Always mask password fields
    if (this.isPasswordField(element)) {
      return '*'.repeat(Math.min(value.length, 8));
    }
    
    // Mask PII fields if PII exclusion is enabled
    if (this.settings?.excludePII && this.isPIIField(element)) {
      return this.maskPIIValue(value, element);
    }
    
    // Check for patterns that look like sensitive data
    if (this.containsSensitivePattern(value)) {
      return this.maskSensitivePattern(value);
    }
    
    // Truncate very long values
    if (value.length > 1000) {
      return value.substring(0, 1000) + '... [truncated]';
    }
    
    return value;
  }

  /**
   * Mask PII values based on field type
   */
  maskPIIValue(value, element) {
    const name = element.name?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const fieldIdentifier = `${name} ${id}`;
    
    // Credit card numbers
    if (fieldIdentifier.includes('credit') || fieldIdentifier.includes('card')) {
      return this.maskCreditCard(value);
    }
    
    // SSN
    if (fieldIdentifier.includes('ssn') || fieldIdentifier.includes('social')) {
      return this.maskSSN(value);
    }
    
    // Phone numbers
    if (fieldIdentifier.includes('phone') || fieldIdentifier.includes('mobile')) {
      return this.maskPhone(value);
    }
    
    // Email addresses
    if (fieldIdentifier.includes('email') || fieldIdentifier.includes('mail')) {
      return this.maskEmail(value);
    }
    
    // Default PII masking
    return '*'.repeat(Math.min(value.length, 6));
  }

  /**
   * Check if value contains sensitive patterns
   */
  containsSensitivePattern(value) {
    const patterns = [
      // Credit card patterns
      /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
      // SSN patterns
      /^\d{3}[\s-]?\d{2}[\s-]?\d{4}$/,
      // Phone patterns
      /^[\+]?[\d\s\-\(\)]{10,}$/,
      // Email patterns
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    ];
    
    return patterns.some(pattern => pattern.test(value.trim()));
  }

  /**
   * Mask sensitive patterns
   */
  maskSensitivePattern(value) {
    const trimmed = value.trim();
    
    // Credit card
    if (/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(trimmed)) {
      return this.maskCreditCard(trimmed);
    }
    
    // SSN
    if (/^\d{3}[\s-]?\d{2}[\s-]?\d{4}$/.test(trimmed)) {
      return this.maskSSN(trimmed);
    }
    
    // Phone
    if (/^[\+]?[\d\s\-\(\)]{10,}$/.test(trimmed)) {
      return this.maskPhone(trimmed);
    }
    
    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return this.maskEmail(trimmed);
    }
    
    // Default masking
    return '*'.repeat(Math.min(value.length, 6));
  }

  /**
   * Mask credit card number
   */
  maskCreditCard(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 4) {
      return '*'.repeat(digits.length - 4) + digits.slice(-4);
    }
    return '*'.repeat(digits.length);
  }

  /**
   * Mask SSN
   */
  maskSSN(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 9) {
      return '***-**-' + digits.slice(-4);
    }
    return '*'.repeat(digits.length);
  }

  /**
   * Mask phone number
   */
  maskPhone(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 4) {
      return '*'.repeat(digits.length - 4) + digits.slice(-4);
    }
    return '*'.repeat(digits.length);
  }

  /**
   * Mask email address
   */
  maskEmail(value) {
    const [local, domain] = value.split('@');
    if (local && domain) {
      const maskedLocal = local.length > 2 ? local[0] + '*'.repeat(local.length - 2) + local.slice(-1) : '*'.repeat(local.length);
      return `${maskedLocal}@${domain}`;
    }
    return '*'.repeat(value.length);
  }

  /**
   * Check if this is a password field
   */
  isPasswordField(element) {
    const type = element.type?.toLowerCase();
    const name = element.name?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const placeholder = element.placeholder?.toLowerCase() || '';
    const className = element.className?.toLowerCase() || '';
    
    // Direct password type
    if (type === 'password') return true;
    
    // Password-related field names
    const passwordKeywords = [
      'password', 'passwd', 'pwd', 'pass', 'secret', 'key', 'token',
      'auth', 'credential', 'login', 'signin', 'sign-in', 'pin', 'code'
    ];
    
    // Check name, id, placeholder, and class for password keywords
    const allText = `${name} ${id} ${placeholder} ${className}`;
    return passwordKeywords.some(keyword => allText.includes(keyword));
  }

  /**
   * Check if this field contains PII (Personal Identifiable Information)
   */
  isPIIField(element) {
    const name = element.name?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const placeholder = element.placeholder?.toLowerCase() || '';
    const className = element.className?.toLowerCase() || '';
    
    // PII-related field names
    const piiKeywords = [
      // Personal Information
      'ssn', 'social', 'security', 'tax', 'id', 'driver', 'license',
      'passport', 'national', 'citizen', 'alien',
      
      // Financial Information
      'credit', 'card', 'cvv', 'cvc', 'expiry', 'expire', 'billing',
      'bank', 'account', 'routing', 'iban', 'swift', 'wire',
      
      // Contact Information
      'phone', 'mobile', 'cell', 'telephone', 'fax',
      'address', 'street', 'city', 'state', 'zip', 'postal',
      
      // Medical Information
      'medical', 'health', 'insurance', 'policy', 'patient',
      'diagnosis', 'treatment', 'prescription',
      
      // Biometric Information
      'fingerprint', 'biometric', 'face', 'voice', 'retina',
      
      // Other Sensitive Data
      'mother', 'maiden', 'birth', 'date', 'dob', 'age',
      'salary', 'income', 'wage', 'pay', 'compensation'
    ];
    
    const allText = `${name} ${id} ${placeholder} ${className}`;
    return piiKeywords.some(keyword => allText.includes(keyword));
  }

  /**
   * Check if this field should be excluded from tracking
   */
  shouldExcludeField(element) {
    // Always exclude password fields
    if (this.isPasswordField(element)) return true;
    
    // Exclude PII fields based on settings
    if (this.settings?.excludePII && this.isPIIField(element)) return true;
    
    // Exclude fields with specific attributes
    if (element.hasAttribute('data-sensitive') || 
        element.hasAttribute('data-private') ||
        element.hasAttribute('data-exclude-tracking')) {
      return true;
    }
    
    // Exclude fields with sensitive classes
    const className = element.className?.toLowerCase() || '';
    const sensitiveClasses = ['sensitive', 'private', 'no-track', 'exclude'];
    if (sensitiveClasses.some(cls => className.includes(cls))) {
      return true;
    }
    
    return false;
  }

  /**
   * Classify data based on element and value
   */
  classifyData(element, value) {
    const classification = {
      level: 'public',
      category: 'general',
      tags: []
    };

    // Password classification
    if (this.isPasswordField(element)) {
      classification.level = 'restricted';
      classification.category = 'authentication';
      classification.tags.push('password', 'sensitive');
      return classification;
    }

    // PII classification
    if (this.isPIIField(element)) {
      classification.level = 'confidential';
      classification.category = 'personal';
      classification.tags.push('pii', 'personal');
      
      // Sub-classify PII
      const name = element.name?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      const fieldIdentifier = `${name} ${id}`;
      
      if (fieldIdentifier.includes('credit') || fieldIdentifier.includes('card')) {
        classification.category = 'financial';
        classification.tags.push('financial', 'payment');
      } else if (fieldIdentifier.includes('ssn') || fieldIdentifier.includes('social')) {
        classification.category = 'identity';
        classification.tags.push('identity', 'government');
      } else if (fieldIdentifier.includes('phone') || fieldIdentifier.includes('mobile')) {
        classification.category = 'contact';
        classification.tags.push('contact', 'communication');
      } else if (fieldIdentifier.includes('email') || fieldIdentifier.includes('mail')) {
        classification.category = 'contact';
        classification.tags.push('contact', 'communication');
      } else if (fieldIdentifier.includes('address') || fieldIdentifier.includes('street')) {
        classification.category = 'location';
        classification.tags.push('location', 'address');
      }
      
      return classification;
    }

    // Pattern-based classification
    if (this.containsSensitivePattern(value)) {
      classification.level = 'confidential';
      classification.tags.push('pattern-detected');
      
      if (/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(value.trim())) {
        classification.category = 'financial';
        classification.tags.push('credit-card', 'payment');
      } else if (/^\d{3}[\s-]?\d{2}[\s-]?\d{4}$/.test(value.trim())) {
        classification.category = 'identity';
        classification.tags.push('ssn', 'government');
      } else if (/^[\+]?[\d\s\-\(\)]{10,}$/.test(value.trim())) {
        classification.category = 'contact';
        classification.tags.push('phone', 'communication');
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        classification.category = 'contact';
        classification.tags.push('email', 'communication');
      }
      
      return classification;
    }

    // Form field classification
    const name = element.name?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const fieldIdentifier = `${name} ${id}`;
    
    if (fieldIdentifier.includes('search') || fieldIdentifier.includes('query')) {
      classification.category = 'search';
      classification.tags.push('search', 'query');
    } else if (fieldIdentifier.includes('comment') || fieldIdentifier.includes('message')) {
      classification.category = 'communication';
      classification.tags.push('comment', 'message');
    } else if (fieldIdentifier.includes('name') || fieldIdentifier.includes('title')) {
      classification.category = 'identification';
      classification.tags.push('name', 'title');
    }

    return classification;
  }

  /**
   * Get element position relative to document
   */
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * Get element position relative to viewport
   */
  getViewportPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      visible: rect.top >= 0 && rect.left >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.right <= window.innerWidth
    };
  }

  /**
   * Generate unique key for element
   */
  getElementKey(element) {
    return `${element.tagName}_${element.type || 'default'}_${element.id || element.name || 'unnamed'}_${element.className}`;
  }

  /**
   * Store input data in Chrome storage
   */
  async storeInputData(inputData) {
    try {
      // Get existing data
      const result = await chrome.storage.local.get(['mylZipInputHistory']);
      const existingData = result.mylZipInputHistory || [];
      
      // Add new data
      existingData.push(inputData);
      
      // Keep only last 1000 entries to prevent storage bloat
      if (existingData.length > 1000) {
        existingData.splice(0, existingData.length - 1000);
      }
      
      // Store back
      await chrome.storage.local.set({ mylZipInputHistory: existingData });
      
    } catch (error) {
      console.error('Myl.Zip: Error storing input data:', error);
    }
  }

  /**
   * Send input data to background script
   */
  async sendInputDataToBackground(inputData) {
    // Temporarily disabled to prevent extension context issues
    if (this.disableBackgroundCommunication) {
      console.log('Myl.Zip: Input data capture disabled due to background communication issues');
      return;
    }
    
    try {
      await chrome.runtime.sendMessage({
        type: 'INPUT_DATA_CAPTURED',
        data: inputData
      });
    } catch (error) {
      console.error('Myl.Zip: Error sending input data to background:', error);
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
      console.error('Myl.Zip: Error getting input history:', error);
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
      this.formInteractions.clear();
      console.log('Myl.Zip: Input history cleared');
    } catch (error) {
      console.error('Myl.Zip: Error clearing input history:', error);
    }
  }

  /**
   * Store a shared thought from another device
   * @param {Object} decryptedThought - Decrypted thought data
   * @param {Object} sharedThought - Shared thought metadata
   */
  async storeSharedThought(decryptedThought, sharedThought) {
    try {
      // Store in local storage for persistence
      const result = await chrome.storage.local.get(['mylZipSharedThoughts']);
      const existingThoughts = result.mylZipSharedThoughts || [];
      
      const thoughtEntry = {
        ...decryptedThought,
        sourceDeviceId: sharedThought.sourceDeviceId,
        receivedAt: Date.now(),
        isShared: true
      };
      
      existingThoughts.push(thoughtEntry);
      
      // Keep only last 100 shared thoughts
      if (existingThoughts.length > 100) {
        existingThoughts.splice(0, existingThoughts.length - 100);
      }
      
      await chrome.storage.local.set({ mylZipSharedThoughts: existingThoughts });
      
      // Update current thought if it's empty
      if (!this.currentThought && decryptedThought.text) {
        this.currentThought = decryptedThought.text;
        this.updateVisualIndicator();
      }
      
      console.log('Myl.Zip: Shared thought stored successfully');
    } catch (error) {
      console.error('Myl.Zip: Error storing shared thought:', error);
    }
  }

  /**
   * Debug method to test thought saving and syncing
   */
  async debugThoughtSystem() {
    console.log('=== Myl.Zip Thought System Debug ===');
    
    // Check settings
    console.log('Settings:', this.settings);
    console.log('Thought tracking enabled:', this.settings?.enableThoughtTracking);
    
    // Check API client
    console.log('API client available:', !!this.apiClient);
    console.log('API client online:', this.apiClient?.isOnline);
    
    // Check encryption
    console.log('Encryption enabled:', this.encryptionEnabled);
    console.log('Encryption service available:', !!this.encryptionService);
    
    // Check device manager
    console.log('Device manager available:', !!this.deviceManager);
    if (this.deviceManager) {
      const status = this.deviceManager.getDeviceStatus();
      console.log('Device status:', status);
    }
    
    // Check current thought
    console.log('Current thought:', this.currentThought);
    console.log('Typing count:', this.typingCount);
    
    // Test thought saving
    if (this.currentThought) {
      console.log('Testing thought save...');
      try {
        await this.saveCurrentThought();
        console.log('Thought save test completed');
      } catch (error) {
        console.error('Thought save test failed:', error);
      }
    }
    
    // Check shared thoughts - temporarily disabled
    if (!this.disableBackgroundCommunication) {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SHARED_THOUGHTS' });
        if (response && response.success) {
          console.log('Shared thoughts count:', response.data.length);
          console.log('Recent shared thoughts:', response.data.slice(-3));
        }
      } catch (error) {
        console.error('Failed to get shared thoughts:', error);
      }
    } else {
      console.log('Myl.Zip: Shared thoughts check disabled due to background communication issues');
    }
    
    console.log('=== Debug Complete ===');
  }

  setupFloatingOrb() {
    // Check if floating orb is enabled in settings
    if (!this.settings.enableFloatingOrb) {
      console.log('Floating orb disabled in settings');
      return;
    }

    // Check if floating orb already exists to prevent duplicates
    if (this.floatingOrb || document.getElementById('myl-zip-floating-orb')) {
      console.log('Floating orb already exists, skipping creation');
      return;
    }
    
    console.log('Setting up floating orb...');
    
    // Create permanent floating orb
    this.floatingOrb = document.createElement('div');
    this.floatingOrb.id = 'myl-zip-floating-orb';
    this.floatingOrb.className = 'myl-zip-floating-orb';
    this.floatingOrb.innerHTML = `
      <div class="myl-zip-orb-core"></div>
      <div class="myl-zip-orb-glow"></div>
      <div class="myl-zip-orb-pulse"></div>
    `;
    document.body.appendChild(this.floatingOrb);
    console.log('Floating orb created and added to DOM');

    // Initialize floating orb position and behavior
    this.initializeFloatingOrb();
  }

  initializeFloatingOrb() {
    console.log('Initializing floating orb...');
    if (!this.floatingOrb) {
      console.log('No floating orb to initialize');
      return;
    }

    // Set initial position (near FAB)
    this.updateFloatingOrbPosition();

    // Add mouse move tracking for orb following
    document.addEventListener('mousemove', (e) => {
      if (this.settings.enableFloatingOrbFollow) {
        this.updateFloatingOrbPosition(e.clientX, e.clientY);
      }
    });

    // Add scroll and resize handling
    window.addEventListener('scroll', () => {
      this.updateFloatingOrbPosition();
    });

    window.addEventListener('resize', () => {
      this.updateFloatingOrbPosition();
    });

    // Add click handler for orb interaction
    this.floatingOrb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleFloatingOrbClick();
    });

    // Add hover effects
    this.floatingOrb.addEventListener('mouseenter', () => {
      this.floatingOrb.classList.add('myl-zip-orb-hover');
    });

    this.floatingOrb.addEventListener('mouseleave', () => {
      this.floatingOrb.classList.remove('myl-zip-orb-hover');
    });

    // Start orb animation
    this.startFloatingOrbAnimation();
  }

  updateFloatingOrbPosition(x = null, y = null) {
    console.log('Updating floating orb position...');
    if (!this.floatingOrb) {
      console.log('No floating orb to position');
      return;
    }

    if (x !== null && y !== null && this.settings.enableFloatingOrbFollow) {
      // Follow cursor with offset
      this.floatingOrb.style.left = `${x + 20}px`;
      this.floatingOrb.style.top = `${y - 20}px`;
      this.floatingOrb.style.transform = 'none';
    } else {
      // Position near the active input field or FAB
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        // Position near the active input field
        const rect = activeElement.getBoundingClientRect();
        this.floatingOrb.style.left = `${rect.right + 20}px`;
        this.floatingOrb.style.top = `${rect.top}px`;
        this.floatingOrb.style.transform = 'none';
        
        // Add focused class for smaller size
        this.floatingOrb.classList.add('focused');
      } else {
        // Remove focused class when not near input
        if (this.floatingOrb) {
          this.floatingOrb.classList.remove('focused');
        }
        // Fixed position near FAB
        const fabRect = this.fab?.getBoundingClientRect();
        if (fabRect) {
          this.floatingOrb.style.left = `${fabRect.left - 80}px`;
          this.floatingOrb.style.top = `${fabRect.top}px`;
          this.floatingOrb.style.transform = 'none';
        } else {
          // Fallback position
          this.floatingOrb.style.left = 'calc(100vw - 120px)';
          this.floatingOrb.style.top = 'calc(100vh - 120px)';
        }
      }
    }

    // Ensure orb stays within viewport bounds
    this.constrainFloatingOrbToViewport();
    
    console.log('Floating orb positioned at:', {
      left: this.floatingOrb.style.left,
      top: this.floatingOrb.style.top,
      visible: this.floatingOrb.offsetParent !== null
    });
  }

  constrainFloatingOrbToViewport() {
    if (!this.floatingOrb) return;

    const orbRect = this.floatingOrb.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const orbSize = 60; // Approximate orb size

    let left = parseFloat(this.floatingOrb.style.left);
    let top = parseFloat(this.floatingOrb.style.top);

    // Constrain horizontal position
    if (left < 20) left = 20;
    if (left > viewportWidth - orbSize - 20) left = viewportWidth - orbSize - 20;

    // Constrain vertical position
    if (top < 20) top = 20;
    if (top > viewportHeight - orbSize - 20) top = viewportHeight - orbSize - 20;

    this.floatingOrb.style.left = `${left}px`;
    this.floatingOrb.style.top = `${top}px`;
  }

  centerFloatingOrb() {
    if (!this.floatingOrb) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const orbSize = 60;

    this.floatingOrb.style.left = `${(viewportWidth - orbSize) / 2}px`;
    this.floatingOrb.style.top = `${(viewportHeight - orbSize) / 2}px`;
    this.floatingOrb.style.transform = 'scale(1.2)';
    
    // Reset transform after animation
    setTimeout(() => {
      if (this.floatingOrb) {
        this.floatingOrb.style.transform = 'none';
      }
    }, 300);
  }

  startFloatingOrbAnimation() {
    if (!this.floatingOrb) return;

    // Add animation classes
    this.floatingOrb.classList.add('myl-zip-orb-animated');
    
    // Update orb state based on service status
    this.updateFloatingOrbState();
  }

  updateFloatingOrbState() {
    if (!this.floatingOrb) return;

    // Remove existing state classes
    this.floatingOrb.classList.remove('myl-zip-orb-active', 'myl-zip-orb-paused', 'myl-zip-orb-inactive');

    // Add appropriate state class
    if (this.serviceEnabled) {
      this.floatingOrb.classList.add('myl-zip-orb-active');
    } else {
      this.floatingOrb.classList.add('myl-zip-orb-inactive');
    }
  }

  handleFloatingOrbClick() {
    // Toggle service when orb is clicked
    this.toggleService();
    
    // Add click animation
    this.floatingOrb.classList.add('myl-zip-orb-clicked');
    setTimeout(() => {
      if (this.floatingOrb) {
        this.floatingOrb.classList.remove('myl-zip-orb-clicked');
      }
    }, 200);
  }
}

// Initialize the content script only if not already initialized
if (!window.mylZipContentScript) {
  window.mylZipContentScript = new MylZipContentScript();
} else {
  console.log('Myl.Zip Content Script: Already initialized, skipping duplicate initialization');
}
