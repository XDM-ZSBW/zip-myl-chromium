/**
 * Frontend Validators - NO BUSINESS LOGIC
 * Only UI and form validation functions
 * All business logic validation must be on the backend
 */

/**
 * Validate email format (frontend only)
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate URL format (frontend only)
 */
export function isValidURL(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID format (frontend only)
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number format (frontend only)
 */
export function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Basic phone validation - allows international formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validate credit card number format (frontend only)
 */
export function isValidCreditCard(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  
  // Remove spaces and dashes
  const cleanNumber = cardNumber.replace(/[\s\-]/g, '');
  
  // Check if it's a valid length
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  // Luhn algorithm check
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate SSN format (frontend only)
 */
export function isValidSSN(ssn) {
  if (!ssn || typeof ssn !== 'string') return false;
  
  // Remove dashes and spaces
  const cleanSSN = ssn.replace(/[\s\-]/g, '');
  
  // Check if it's 9 digits
  if (!/^\d{9}$/.test(cleanSSN)) return false;
  
  // Check for invalid patterns
  const invalidPatterns = [
    /^000/, /^666/, /^9\d{2}/, // Invalid first 3 digits
    /^\d{3}00/, /^\d{5}0000/   // Invalid middle or last 4 digits
  ];
  
  return !invalidPatterns.some(pattern => pattern.test(cleanSSN));
}

/**
 * Validate password strength (frontend only)
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
}

/**
 * Get password strength score (frontend only)
 */
export function getPasswordStrength(password) {
  if (!password || typeof password !== 'string') return 0;
  
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  // Complexity
  if (password.length > 8 && /[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (password.length > 8 && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  return Math.min(score, 5);
}

/**
 * Validate required field (frontend only)
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * Validate minimum length (frontend only)
 */
export function hasMinLength(value, minLength) {
  if (!value || typeof value !== 'string') return false;
  return value.length >= minLength;
}

/**
 * Validate maximum length (frontend only)
 */
export function hasMaxLength(value, maxLength) {
  if (!value || typeof value !== 'string') return false;
  return value.length <= maxLength;
}

/**
 * Validate exact length (frontend only)
 */
export function hasExactLength(value, length) {
  if (!value || typeof value !== 'string') return false;
  return value.length === length;
}

/**
 * Validate numeric range (frontend only)
 */
export function isInRange(value, min, max) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validate positive number (frontend only)
 */
export function isPositive(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num > 0;
}

/**
 * Validate non-negative number (frontend only)
 */
export function isNonNegative(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= 0;
}

/**
 * Validate integer (frontend only)
 */
export function isInteger(value) {
  if (typeof value === 'number') return Number.isInteger(value);
  if (typeof value === 'string') return /^-?\d+$/.test(value);
  return false;
}

/**
 * Validate date (frontend only)
 */
export function isValidDate(date) {
  if (!date) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
}

/**
 * Validate future date (frontend only)
 */
export function isFutureDate(date) {
  if (!isValidDate(date)) return false;
  
  const dateObj = new Date(date);
  const now = new Date();
  return dateObj > now;
}

/**
 * Validate past date (frontend only)
 */
export function isPastDate(date) {
  if (!isValidDate(date)) return false;
  
  const dateObj = new Date(date);
  const now = new Date();
  return dateObj < now;
}

/**
 * Validate form data (frontend only)
 */
export function validateFormData(formData, validationRules) {
  const errors = {};
  
  Object.entries(validationRules).forEach(([field, rules]) => {
    const value = formData[field];
    const fieldErrors = [];
    
    rules.forEach(rule => {
      const { validator, message, params = [] } = rule;
      
      if (!validator(value, ...params)) {
        fieldErrors.push(message);
      }
    });
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Create validation rule (frontend only)
 */
export function createValidationRule(validator, message, params = []) {
  return { validator, message, params };
}

/**
 * Common validation rules (frontend only)
 */
export const COMMON_VALIDATION_RULES = {
  required: (value) => createValidationRule(isRequired, 'This field is required'),
  email: (value) => createValidationRule(isValidEmail, 'Please enter a valid email address'),
  url: (value) => createValidationRule(isValidURL, 'Please enter a valid URL'),
  minLength: (min) => (value) => createValidationRule(
    hasMinLength, 
    `Must be at least ${min} characters long`, 
    [min]
  ),
  maxLength: (max) => (value) => createValidationRule(
    hasMaxLength, 
    `Must be no more than ${max} characters long`, 
    [max]
  ),
  exactLength: (length) => (value) => createValidationRule(
    hasExactLength, 
    `Must be exactly ${length} characters long`, 
    [length]
  ),
  range: (min, max) => (value) => createValidationRule(
    isInRange, 
    `Must be between ${min} and ${max}`, 
    [min, max]
  ),
  positive: (value) => createValidationRule(isPositive, 'Must be a positive number'),
  nonNegative: (value) => createValidationRule(isNonNegative, 'Must be a non-negative number'),
  integer: (value) => createValidationRule(isInteger, 'Must be a whole number'),
  date: (value) => createValidationRule(isValidDate, 'Please enter a valid date'),
  futureDate: (value) => createValidationRule(isFutureDate, 'Date must be in the future'),
  pastDate: (value) => createValidationRule(isPastDate, 'Date must be in the past')
};
