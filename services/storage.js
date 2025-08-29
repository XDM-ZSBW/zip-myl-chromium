/**
 * Simple Storage Service - NO BUSINESS LOGIC
 * Only handles Chrome extension storage operations
 * All business logic must be on the backend
 */

class StorageService {
  constructor() {
    // Use Chrome extension storage API
    this.storage = chrome.storage.local;
  }

  /**
   * Store data - NO processing or encryption
   */
  async store(key, value) {
    try {
      const data = { [key]: value };
      await this.storage.set(data);
      return true;
    } catch (error) {
      console.error('Storage store error:', error);
      return false;
    }
  }

  /**
   * Retrieve data - NO processing or decryption
   */
  async retrieve(key) {
    try {
      const result = await this.storage.get(key);
      return result[key];
    } catch (error) {
      console.error('Storage retrieve error:', error);
      return null;
    }
  }

  /**
   * Remove data
   */
  async remove(key) {
    try {
      await this.storage.remove(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  /**
   * Clear all data
   */
  async clear() {
    try {
      await this.storage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async getMultiple(keys) {
    try {
      return await this.storage.get(keys);
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      return {};
    }
  }

  /**
   * Set multiple keys at once
   */
  async setMultiple(data) {
    try {
      await this.storage.set(data);
      return true;
    } catch (error) {
      console.error('Storage setMultiple error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async hasKey(key) {
    try {
      const result = await this.storage.get(key);
      return key in result;
    } catch (error) {
      console.error('Storage hasKey error:', error);
      return false;
    }
  }

  /**
   * Get all stored keys
   */
  async getAllKeys() {
    try {
      const result = await this.storage.get(null);
      return Object.keys(result);
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo() {
    try {
      const result = await this.storage.getBytesInUse(null);
      return {
        bytesUsed: result,
        keys: await this.getAllKeys()
      };
    } catch (error) {
      console.error('Storage getStorageInfo error:', error);
      return { bytesUsed: 0, keys: [] };
    }
  }
}

// Export for use in UI components
window.StorageService = StorageService;
