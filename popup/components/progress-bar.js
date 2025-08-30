/**
 * Zip Myl Chromium - Progress Bar Web Component
 * Displays progress for NFT pairing code generation
 */

class ProgressBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.progress = 0;
    this.status = 'pending';
    this.message = '';
    this.estimatedTime = '';
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['progress', 'status', 'message', 'estimated-time'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'progress':
          this.setProgress(parseFloat(newValue) || 0);
          break;
        case 'status':
          this.setStatus(newValue);
          break;
        case 'message':
          this.setMessage(newValue);
          break;
        case 'estimated-time':
          this.setEstimatedTime(newValue);
          break;
      }
    }
  }

  setProgress(percentage) {
    this.progress = Math.max(0, Math.min(100, percentage));
    const progressElement = this.shadowRoot.querySelector('.progress-fill');
    if (progressElement) {
      progressElement.style.width = `${this.progress}%`;
    }
  }

  setStatus(status) {
    this.status = status;
    const container = this.shadowRoot.querySelector('.progress-container');
    if (container) {
      container.className = `progress-container status-${status}`;
    }
  }

  setMessage(message) {
    this.message = message;
    const messageElement = this.shadowRoot.querySelector('.status-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
  }

  setEstimatedTime(time) {
    this.estimatedTime = time;
    const timeElement = this.shadowRoot.querySelector('.estimated-time');
    if (timeElement) {
      timeElement.textContent = time;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .progress-container {
          width: 100%;
          height: 20px;
          background: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          margin: 10px 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
          width: 0%;
          border-radius: 10px;
        }

        .progress-container.status-pending .progress-fill {
          background: linear-gradient(90deg, #ffa500, #ff8c00);
        }

        .progress-container.status-generating .progress-fill {
          background: linear-gradient(90deg, #0066cc, #0052a3);
          animation: pulse 2s infinite;
        }

        .progress-container.status-ready .progress-fill {
          background: linear-gradient(90deg, #00cc00, #00a000);
        }

        .progress-container.status-active .progress-fill {
          background: linear-gradient(90deg, #00cc00, #00a000);
        }

        .progress-container.status-failed .progress-fill {
          background: linear-gradient(90deg, #cc0000, #a00000);
        }

        .progress-container.status-expired .progress-fill {
          background: linear-gradient(90deg, #cc0000, #a00000);
        }

        .progress-container.status-cancelled .progress-fill {
          background: linear-gradient(90deg, #666666, #444444);
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 5px;
          font-size: 12px;
          color: #666;
        }

        .status-message {
          font-weight: 500;
          color: #333;
        }

        .estimated-time {
          color: #666;
        }

        .progress-percentage {
          font-weight: bold;
          color: #333;
        }
      </style>
      
      <div class="progress-container status-${this.status}">
        <div class="progress-fill"></div>
      </div>
      
      <div class="progress-info">
        <span class="status-message">${this.message}</span>
        <span class="estimated-time">${this.estimatedTime}</span>
        <span class="progress-percentage">${Math.round(this.progress)}%</span>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('progress-bar', ProgressBar);

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ProgressBar = ProgressBar;
}
