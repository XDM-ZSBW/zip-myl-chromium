/**
 * Zip Myl Chromium - Popup Initialization Script
 * Handles service initialization before popup loads
 */

// Ensure all services are loaded before popup initialization
document.addEventListener('DOMContentLoaded', () => {
  // Check if all required services are available
  const requiredServices = [
    'ZipMylApiClient',
    'ZipMylStorageService', 
    'ZipMylAuthService',
    'ZipMylNFTService',
    'ZipMylStateManager'
  ];
  
  const missingServices = requiredServices.filter(service => !window[service]);
  
  if (missingServices.length > 0) {
    console.error('Zip Myl Chromium: Missing services:', missingServices);
    const footerStatus = document.getElementById('footerStatus');
    if (footerStatus) {
      footerStatus.textContent = 'Error: Missing services';
    }
    return;
  }
  
  // Initialize state manager first
  window.ZipMylStateManager.init(window.ZipMylStorageService).then(() => {
    console.log('Zip Myl Chromium: Services initialized successfully');
    // Now load the popup script
    const script = document.createElement('script');
    script.src = 'popup.js';
    document.head.appendChild(script);
  }).catch(error => {
    console.error('Zip Myl Chromium: Failed to initialize services:', error);
    const footerStatus = document.getElementById('footerStatus');
    if (footerStatus) {
      footerStatus.textContent = 'Error: Service initialization failed';
    }
  });
});
