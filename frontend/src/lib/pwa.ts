// Clean single implementation of PWA manager

class PWAManager {
  private deferredPrompt: any = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    console.log('PWA Manager: Initializing and setting up beforeinstallprompt listener');
    
    // Capture beforeinstallprompt so UI can show a custom install button
    window.addEventListener('beforeinstallprompt', (e: any) => {
      console.log('🎉 beforeinstallprompt event FIRED!', e);
      try {
        e.preventDefault();
        console.log('✅ preventDefault() called successfully');
      } catch (err) {
        console.error('❌ Failed to preventDefault:', err);
      }
      this.deferredPrompt = e;
      console.log('✅ beforeinstallprompt captured, canInstall: true');
      console.log('Prompt object stored:', this.deferredPrompt);
      // Dispatch event and also notify listeners
      window.dispatchEvent(new CustomEvent('pwa-install-prompt-change', { detail: { canInstall: true } }));
      this.notifyListeners();
    });

    // Clear when app is installed
    window.addEventListener('appinstalled', () => {
      console.log('App installed');
      this.deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-install-prompt-change', { detail: { canInstall: false } }));
      this.notifyListeners();
    });
  }

  // Add listener for state changes
  onChange(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error('Error in PWA listener:', err);
      }
    });
  }

  getInstallPrompt(): any | null {
    return this.deferredPrompt;
  }

  async installApp(): Promise<{ outcome: 'accepted' | 'dismissed' | 'error' | 'not-available' } | null> {
    if (!this.deferredPrompt) {
      return { outcome: 'not-available' };
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-install-prompt-change', { detail: { canInstall: false } }));
      this.notifyListeners();
      return { outcome: choice?.outcome ?? 'dismissed' };
    } catch (err) {
      console.error('PWA install error', err);
      return { outcome: 'error' };
    }
  }

  isAppInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    // iOS
    if ((navigator as any).standalone === true) return true;

    // display-mode
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    } catch (err) {
      // ignore
    }

    // fallback
    return false;
  }

  isInstallSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  getInstallInstructions(): { browser: string; desktop: string; mobile: string } {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edg')) {
      return {
        browser: 'Chrome',
        desktop: 'Look for the install icon in the address bar or use the menu → "Install"',
        mobile: 'Tap the menu (⋮) → "Add to Home screen"',
      };
    }
    if (ua.includes('safari') && !ua.includes('crios')) {
      return {
        browser: 'Safari',
        desktop: "Safari doesn't support PWA installation on desktop",
        mobile: 'Tap the Share button → "Add to Home Screen"',
      };
    }
    if (ua.includes('edg')) {
      return {
        browser: 'Edge',
        desktop: 'Look for the install icon in the address bar or use the menu → "Apps" → "Install"',
        mobile: 'Tap the menu (⋯) → "Add to phone"',
      };
    }

    return {
      browser: 'Unknown',
      desktop: 'Look for an install option in your browser menu',
      mobile: 'Look for an "Add to Home Screen" option in your browser menu',
    };
  }
}

const pwaManager = new PWAManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).pwaManager = pwaManager;
  console.log('PWA Manager initialized and exposed to window.pwaManager');
}

export default pwaManager;