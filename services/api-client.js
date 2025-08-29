/**
 * Simple API Client - NO BUSINESS LOGIC
 * Only handles HTTP requests and responses
 * All business logic must be on the backend
 */

class APIClient {
  constructor() {
    this.baseURL = 'https://api.backend.com'; // Backend API endpoint
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Generic HTTP request method - NO BUSINESS LOGIC
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        method: options.method || 'GET',
        headers: { ...this.headers, ...options.headers },
        ...options
      };

      if (options.body) {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Return raw response - NO processing
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Device Management - Simple API calls only
  async registerDevice(deviceData) {
    return this.request('/devices/register', {
      method: 'POST',
      body: deviceData
    });
  }

  async getDeviceStatus(deviceId) {
    return this.request(`/devices/${deviceId}/status`);
  }

  // Authentication - Simple API calls only
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials
    });
  }

  async refreshToken(token) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: { token }
    });
  }

  // NFT Operations - Simple API calls only
  async generatePairingCode() {
    return this.request('/nft/pairing-code', {
      method: 'POST'
    });
  }

  async getPairingStatus(pairingId) {
    return this.request(`/nft/pairing/${pairingId}/status`);
  }

  // Thoughts - Simple API calls only
  async saveThought(thoughtData) {
    return this.request('/thoughts', {
      method: 'POST',
      body: thoughtData
    });
  }

  async getThoughts(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/thoughts?${queryParams}`);
  }

  // Health Check
  async checkHealth() {
    return this.request('/health');
  }
}

// Export for use in UI components
window.APIClient = APIClient;
