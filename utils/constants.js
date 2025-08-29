/**
 * Frontend Constants - NO BUSINESS LOGIC
 * Only UI and frontend configuration constants
 * All business logic constants must be on the backend
 */

// UI Configuration
export const UI_CONFIG = {
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
  },
  
  LANGUAGES: {
    EN: 'en',
    ES: 'es',
    FR: 'fr',
    DE: 'de'
  },
  
  ANIMATIONS: {
    DURATION: 300,
    EASING: 'ease-in-out'
  },
  
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200
  }
};

// Extension Configuration
export const EXTENSION_CONFIG = {
  NAME: 'Zip Myl Chromium',
  VERSION: '1.0.0',
  AUTHOR: 'Myl.Zip Team',
  
  STORAGE_KEYS: {
    UI_PREFERENCES: 'ui_preferences',
    THEME: 'theme',
    LANGUAGE: 'language',
    NOTIFICATIONS: 'notifications',
    FORM_DATA: 'form_data'
  },
  
  DEFAULT_SETTINGS: {
    theme: 'light',
    language: 'en',
    compactMode: false,
    showAnimations: true,
    autoSave: true
  }
};

// UI Events
export const UI_EVENTS = {
  THEME_CHANGED: 'themeChanged',
  LANGUAGE_CHANGED: 'languageChanged',
  VIEW_CHANGED: 'viewChanged',
  MODAL_OPENED: 'modalOpened',
  MODAL_CLOSED: 'modalClosed',
  NOTIFICATION_ADDED: 'notificationAdded',
  NOTIFICATION_REMOVED: 'notificationRemoved',
  FORM_ERRORS_UPDATED: 'formErrorsUpdated',
  LOADING_STATE_CHANGED: 'loadingStateChanged'
};

// CSS Classes
export const CSS_CLASSES = {
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  HIDDEN: 'hidden',
  VISIBLE: 'visible',
  ACTIVE: 'active',
  DISABLED: 'disabled'
};

// Animation Classes
export const ANIMATION_CLASSES = {
  FADE_IN: 'fade-in',
  FADE_OUT: 'fade-out',
  SLIDE_IN: 'slide-in',
  SLIDE_OUT: 'slide-out',
  SCALE_IN: 'scale-in',
  SCALE_OUT: 'scale-out'
};

// Message Types
export const MESSAGE_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Form Validation
export const VALIDATION_RULES = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 1000,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_REGEX: /^https?:\/\/.+/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/
};

// Performance Thresholds
export const PERFORMANCE = {
  ANIMATION_FRAME_RATE: 60,
  MAX_ANIMATION_DURATION: 1000,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100
};

// Accessibility
export const ACCESSIBILITY = {
  ARIA_LABELS: {
    CLOSE: 'Close',
    OPEN: 'Open',
    SUBMIT: 'Submit',
    CANCEL: 'Cancel',
    LOADING: 'Loading',
    ERROR: 'Error'
  },
  
  KEYBOARD_KEYS: {
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight'
  }
};
