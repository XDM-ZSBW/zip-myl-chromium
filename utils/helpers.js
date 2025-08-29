/**
 * Frontend Helpers - NO BUSINESS LOGIC
 * Only UI and frontend utility functions
 * All business logic must be on the backend
 */

/**
 * Generate unique ID for UI elements
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${random}`;
}

/**
 * Debounce function calls for performance
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls for performance
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone object (frontend only)
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * Deep merge objects (frontend only)
 */
export function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Format date for UI display
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Sanitize HTML for safe display
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter
 */
export function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Generate random number between min and max
 */
export function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep/delay function
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }
}

/**
 * Create DOM element with attributes
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Add children
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Add event listener with cleanup
 */
export function addEventListenerWithCleanup(element, event, handler, options = {}) {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/**
 * Remove all event listeners from element
 */
export function removeAllEventListeners(element) {
  const clone = element.cloneNode(true);
  element.parentNode.replaceChild(clone, element);
  return clone;
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(element, offset = 0) {
  const elementPosition = element.offsetTop - offset;
  window.scrollTo({
    top: elementPosition,
    behavior: 'smooth'
  });
}

/**
 * Get computed styles
 */
export function getComputedStyles(element, properties = []) {
  const styles = window.getComputedStyle(element);
  if (properties.length === 0) return styles;
  
  const result = {};
  properties.forEach(prop => {
    result[prop] = styles.getPropertyValue(prop);
  });
  return result;
}

/**
 * Add/remove CSS classes
 */
export function toggleClass(element, className, force = null) {
  if (force === null) {
    element.classList.toggle(className);
  } else {
    element.classList.toggle(className, force);
  }
}

/**
 * Check if element has class
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

/**
 * Add CSS class
 */
export function addClass(element, className) {
  element.classList.add(className);
}

/**
 * Remove CSS class
 */
export function removeClass(element, className) {
  element.classList.remove(className);
}

/**
 * Set CSS custom property
 */
export function setCSSProperty(element, property, value) {
  element.style.setProperty(property, value);
}

/**
 * Get CSS custom property
 */
export function getCSSProperty(element, property) {
  return getComputedStyles(element, [property])[property];
}

/**
 * Animate element with CSS transitions
 */
export function animateElement(element, properties, duration = 300, easing = 'ease-in-out') {
  const originalTransition = element.style.transition;
  element.style.transition = `all ${duration}ms ${easing}`;
  
  Object.entries(properties).forEach(([property, value]) => {
    element.style[property] = value;
  });
  
  setTimeout(() => {
    element.style.transition = originalTransition;
  }, duration);
}

/**
 * Detect device type
 */
export function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/windows/.test(userAgent)) return 'windows';
  if (/mac/.test(userAgent)) return 'mac';
  if (/linux/.test(userAgent)) return 'linux';
  
  return 'unknown';
}

/**
 * Check if device is mobile
 */
export function isMobile() {
  return /android|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent);
}

/**
 * Check if device supports touch
 */
export function supportsTouch() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
}

/**
 * Check if element is visible
 */
export function isElementVisible(element) {
  const styles = window.getComputedStyle(element);
  return styles.display !== 'none' && 
         styles.visibility !== 'hidden' && 
         styles.opacity !== '0';
}

/**
 * Focus management helper
 */
export function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}
