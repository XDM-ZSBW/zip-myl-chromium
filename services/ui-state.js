/**
 * UI State Manager - NO BUSINESS LOGIC
 * Only manages frontend presentation state
 * All business logic must be on the backend
 */

class UIStateManager {
  constructor() {
    this.state = {
      // UI State Only - No Business Data
      isLoading: false,
      currentView: 'popup',
      theme: 'light',
      language: 'en',
      notifications: [],
      popupOpen: false,
      sidebarOpen: false,
      modalOpen: false,
      currentModal: null,
      toastMessages: [],
      formErrors: {},
      uiPreferences: {
        compactMode: false,
        showAnimations: true,
        autoSave: true
      }
    };
    
    this.listeners = new Set();
  }

  /**
   * Update UI state - NO business logic
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  /**
   * Get current UI state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Subscribe to UI state changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('UI state listener error:', error);
      }
    });
  }

  // UI State Methods - No Business Logic
  
  setLoading(isLoading) {
    this.setState({ isLoading });
  }

  setCurrentView(view) {
    this.setState({ currentView: view });
  }

  setTheme(theme) {
    this.setState({ theme });
  }

  setLanguage(language) {
    this.setState({ language });
  }

  addNotification(notification) {
    const notifications = [...this.state.notifications, notification];
    this.setState({ notifications });
  }

  removeNotification(id) {
    const notifications = this.state.notifications.filter(n => n.id !== id);
    this.setState({ notifications });
  }

  setPopupOpen(isOpen) {
    this.setState({ popupOpen: isOpen });
  }

  setSidebarOpen(isOpen) {
    this.setState({ sidebarOpen: isOpen });
  }

  openModal(modalType) {
    this.setState({ 
      modalOpen: true, 
      currentModal: modalType 
    });
  }

  closeModal() {
    this.setState({ 
      modalOpen: false, 
      currentModal: null 
    });
  }

  addToastMessage(message) {
    const toastMessages = [...this.state.toastMessages, message];
    this.setState({ toastMessages });
  }

  removeToastMessage(id) {
    const toastMessages = this.state.toastMessages.filter(m => m.id !== id);
    this.setState({ toastMessages });
  }

  setFormErrors(errors) {
    this.setState({ formErrors: errors });
  }

  clearFormErrors() {
    this.setState({ formErrors: {} });
  }

  updateUIPreferences(preferences) {
    const uiPreferences = { ...this.state.uiPreferences, ...preferences };
    this.setState({ uiPreferences });
  }

  // Reset all UI state
  reset() {
    this.state = {
      isLoading: false,
      currentView: 'popup',
      theme: 'light',
      language: 'en',
      notifications: [],
      popupOpen: false,
      sidebarOpen: false,
      modalOpen: false,
      currentModal: null,
      toastMessages: [],
      formErrors: {},
      uiPreferences: {
        compactMode: false,
        showAnimations: true,
        autoSave: true
      }
    };
    this.notifyListeners();
  }
}

// Export for use in UI components
window.UIStateManager = UIStateManager;
