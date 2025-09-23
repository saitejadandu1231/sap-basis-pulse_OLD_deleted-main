// PWA Service Worker Registration and Management

class PWAManager {
  private deferredPrompt: any = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('SW registered: ', registration);
            this.checkForUpdates(registration);
          })
          .catch((registrationError) => {
            console.error('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
      // Show install banner immediately when prompt is available
      setTimeout(() => this.showInstallBanner(), 1000);
    });

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallBanner();
    });

    // Check if already installed
    this.checkIfInstalled();
  }

  private checkForUpdates(registration: ServiceWorkerRegistration) {
    if (registration.waiting) {
      this.showUpdateAvailable();
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateAvailable();
          }
        });
      }
    });
  }

  private checkIfInstalled() {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone) {
      this.isInstalled = true;
    }
  }

  private showInstallBanner() {
    // Create and show install banner
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed top-0 left-0 right-0 z-50 bg-yuktor-600 text-white p-4 shadow-lg transform -translate-y-full transition-transform duration-300';
    banner.innerHTML = `
      <div class="container mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="text-sm font-medium">
            Install SAP BASIS Pulse for a better experience
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button id="pwa-install-btn" class="bg-white text-yuktor-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors">
            Install App
          </button>
          <button id="pwa-dismiss-btn" class="text-white hover:text-gray-200 p-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    
    // Animate in
    setTimeout(() => {
      banner.classList.remove('-translate-y-full');
    }, 100);

    // Add event listeners
    const installBtn = document.getElementById('pwa-install-btn');
    const dismissBtn = document.getElementById('pwa-dismiss-btn');

    installBtn?.addEventListener('click', () => {
      this.installApp();
    });

    dismissBtn?.addEventListener('click', () => {
      this.hideInstallBanner();
    });
  }

  private hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.add('-translate-y-full');
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  private showUpdateAvailable() {
    // Show update notification
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-1">
          <p class="text-sm font-medium">App Update Available</p>
          <p class="text-xs mt-1 opacity-90">A new version of SAP BASIS Pulse is ready to install.</p>
        </div>
        <button id="pwa-update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors">
          Update
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    const updateBtn = document.getElementById('pwa-update-btn');
    updateBtn?.addEventListener('click', () => {
      this.updateApp();
      notification.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  public installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        this.deferredPrompt = null;
      });
      this.hideInstallBanner();
    }
  }

  private updateApp() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public getInstallPrompt() {
    return this.deferredPrompt;
  }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Export for use in components
export default pwaManager;