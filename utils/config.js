/**
 * Frontend Configuration - NO BUSINESS LOGIC
 * Only UI and frontend configuration settings
 * All business logic configuration must be on the backend
 */

// Frontend Configuration
const FRONTEND_CONFIG = {
  // UI Settings
  UI: {
    THEME: {
      DEFAULT: 'light',
      OPTIONS: ['light', 'dark', 'auto']
    },
    
    LANGUAGE: {
      DEFAULT: 'en',
      OPTIONS: ['en', 'es', 'fr', 'de']
    },
    
    ANIMATIONS: {
      ENABLED: true,
      DURATION: 300,
      EASING: 'ease-in-out'
    },
    
    LAYOUT: {
      COMPACT_MODE: false,
      SIDEBAR_WIDTH: 280,
      POPUP_WIDTH: 400,
      POPUP_HEIGHT: 600
    }
  },
  
  // Extension Settings
  EXTENSION: {
    NAME: 'Zip Myl Chromium',
    VERSION: '1.0.0',
    AUTHOR: 'Myl.Zip Team',
    
    STORAGE_KEYS: {
      UI_PREFERENCES: 'ui_preferences',
      THEME: 'theme',
      LANGUAGE: 'language',
      NOTIFICATIONS: 'notifications',
      FORM_DATA: 'form_data',
      SETTINGS: 'settings'
    },
    
    DEFAULT_SETTINGS: {
      theme: 'light',
      language: 'en',
      compactMode: false,
      showAnimations: true,
      autoSave: true,
      notifications: true,
      soundEnabled: false
    }
  },
  
  // Performance Settings
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    ANIMATION_FRAME_RATE: 60,
    MAX_ANIMATION_DURATION: 1000,
    LAZY_LOAD_THRESHOLD: 100
  },
  
  // Accessibility Settings
  ACCESSIBILITY: {
    HIGH_CONTRAST: false,
    REDUCED_MOTION: false,
    FOCUS_INDICATORS: true,
    SCREEN_READER_SUPPORT: true
  }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FRONTEND_CONFIG;
} else if (typeof window !== 'undefined') {
  window.FRONTEND_CONFIG = FRONTEND_CONFIG;
}
