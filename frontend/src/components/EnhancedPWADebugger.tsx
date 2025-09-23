import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Download, RefreshCw, Zap, Clock } from 'lucide-react';

const EnhancedPWADebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState({
    serviceWorkerSupported: false,
    serviceWorkerRegistered: false,
    manifestDetected: false,
    httpsOrLocalhost: false,
    installPromptAvailable: false,
    isStandalone: false,
    iconsAccessible: false,
    hasUserGesture: false,
    notPreviouslyInstalled: true,
    userAgent: '',
    errors: [] as string[],
    warnings: [] as string[]
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isWaitingForPrompt, setIsWaitingForPrompt] = useState(false);
  const [engagementAttempts, setEngagementAttempts] = useState(0);

  useEffect(() => {
    const checkPWAStatus = async () => {
      const info = {
        serviceWorkerSupported: 'serviceWorker' in navigator,
        serviceWorkerRegistered: false,
        manifestDetected: false,
        httpsOrLocalhost: location.protocol === 'https:' || location.hostname === 'localhost',
        installPromptAvailable: false,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone,
        iconsAccessible: false,
        hasUserGesture: (document as any).hasStoredUserActivation !== false,
        notPreviouslyInstalled: !localStorage.getItem('pwa-installed'),
        userAgent: navigator.userAgent,
        errors: [] as string[],
        warnings: [] as string[]
      };

      // Check service worker registration
      if (info.serviceWorkerSupported) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          info.serviceWorkerRegistered = !!registration;
          if (!registration) {
            info.errors.push('Service Worker not found - check registration');
          }
        } catch (error) {
          info.errors.push(`Service Worker error: ${error}`);
        }
      } else {
        info.errors.push('Service Worker not supported');
      }

      // Check manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      info.manifestDetected = !!manifestLink;
      
      if (manifestLink) {
        try {
          const manifestUrl = (manifestLink as HTMLLinkElement).href;
          const response = await fetch(manifestUrl);
          if (!response.ok) {
            info.errors.push(`Manifest fetch failed: ${response.status}`);
          } else {
            const manifest = await response.json();
            console.log('Manifest loaded:', manifest);
            
            // Check icons
            if (manifest.icons && manifest.icons.length > 0) {
              try {
                const iconResponse = await fetch(manifest.icons[0].src);
                info.iconsAccessible = iconResponse.ok;
                if (!iconResponse.ok) {
                  info.errors.push(`Icon not accessible: ${iconResponse.status}`);
                }
              } catch (error) {
                info.errors.push(`Icon fetch error: ${error}`);
              }
            } else {
              info.errors.push('No icons defined in manifest');
            }

            // Check required manifest fields
            if (!manifest.name && !manifest.short_name) {
              info.errors.push('Manifest missing name/short_name');
            }
            if (!manifest.start_url) {
              info.errors.push('Manifest missing start_url');
            }
            if (manifest.display !== 'standalone' && manifest.display !== 'minimal-ui') {
              info.warnings.push('Display mode should be standalone or minimal-ui');
            }
          }
        } catch (error) {
          info.errors.push(`Manifest error: ${error}`);
        }
      } else {
        info.errors.push('No manifest link found in HTML');
      }

      // Additional PWA checks
      if (localStorage.getItem('pwa-installed')) {
        info.warnings.push('App may have been previously installed');
      }

      if (!info.hasUserGesture) {
        info.warnings.push('User engagement may be insufficient');
      }

      setDebugInfo(info);
    };

    checkPWAStatus();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setDebugInfo(prev => ({ ...prev, installPromptAvailable: true }));
      setIsWaitingForPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      localStorage.setItem('pwa-installed', 'true');
      setDebugInfo(prev => ({ ...prev, isStandalone: true, installPromptAvailable: false }));
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('User choice:', choiceResult);
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setDebugInfo(prev => ({ ...prev, installPromptAvailable: false }));
    }
  };

  const simulateEngagement = () => {
    setIsWaitingForPrompt(true);
    setEngagementAttempts(prev => prev + 1);
    
    // Create multiple user interactions
    const interactions = ['click', 'keydown', 'touchstart', 'mousedown'];
    interactions.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      document.dispatchEvent(event);
    });

    // Wait for potential install prompt
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log('Install prompt still not available after engagement simulation');
        setIsWaitingForPrompt(false);
      }
    }, 3000);
  };

  const forceRecheck = () => {
    window.location.reload();
  };

  const clearPWAData = () => {
    localStorage.removeItem('pwa-installed');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    setTimeout(() => forceRecheck(), 1000);
  };

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;

  const WarningIcon = () => <AlertCircle className="h-4 w-4 text-yellow-600" />;

  return (
    <Card className="fixed top-4 right-4 z-50 w-96 max-h-[90vh] overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Enhanced PWA Debugger
          <Badge variant="outline" className="text-xs">
            {engagementAttempts > 0 && `Attempts: ${engagementAttempts}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Service Worker Support:</span>
            <StatusIcon status={debugInfo.serviceWorkerSupported} />
          </div>
          
          <div className="flex items-center justify-between">
            <span>Service Worker Registered:</span>
            <StatusIcon status={debugInfo.serviceWorkerRegistered} />
          </div>
          
          <div className="flex items-center justify-between">
            <span>Manifest Detected:</span>
            <StatusIcon status={debugInfo.manifestDetected} />
          </div>
          
          <div className="flex items-center justify-between">
            <span>HTTPS/Localhost:</span>
            <StatusIcon status={debugInfo.httpsOrLocalhost} />
          </div>
          
          <div className="flex items-center justify-between">
            <span>Icons Accessible:</span>
            <StatusIcon status={debugInfo.iconsAccessible} />
          </div>
          
          <div className="flex items-center justify-between">
            <span>User Engagement:</span>
            <StatusIcon status={debugInfo.hasUserGesture} />
          </div>
          
          <div className="flex items-center justify-between">
            <span>Not Previously Installed:</span>
            <StatusIcon status={debugInfo.notPreviouslyInstalled} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Install Prompt Available:</span>
            {isWaitingForPrompt ? (
              <Clock className="h-4 w-4 text-blue-600 animate-spin" />
            ) : (
              <StatusIcon status={debugInfo.installPromptAvailable} />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Running as PWA:</span>
            <StatusIcon status={debugInfo.isStandalone} />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {debugInfo.installPromptAvailable && (
            <Button onClick={handleInstallClick} size="sm" className="flex-1">
              <Download className="h-3 w-3 mr-1" />
              Install App
            </Button>
          )}

          {!debugInfo.installPromptAvailable && !debugInfo.isStandalone && (
            <Button onClick={simulateEngagement} size="sm" variant="outline" disabled={isWaitingForPrompt}>
              <Zap className="h-3 w-3 mr-1" />
              {isWaitingForPrompt ? 'Waiting...' : 'Trigger Engagement'}
            </Button>
          )}

          <Button onClick={forceRecheck} size="sm" variant="outline">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="pt-2 border-t">
          <div className="mb-1 font-medium">Browser:</div>
          <div className="text-xs text-muted-foreground break-all">
            {debugInfo.userAgent.includes('Chrome') && <Badge variant="outline">Chrome</Badge>}
            {debugInfo.userAgent.includes('Firefox') && <Badge variant="outline">Firefox</Badge>}
            {debugInfo.userAgent.includes('Safari') && <Badge variant="outline">Safari</Badge>}
            {debugInfo.userAgent.includes('Edge') && <Badge variant="outline">Edge</Badge>}
          </div>
        </div>

        {debugInfo.errors.length > 0 && (
          <div className="pt-2 border-t">
            <div className="mb-1 font-medium text-red-600">Errors:</div>
            {debugInfo.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-600 break-all mb-1">
                • {error}
              </div>
            ))}
          </div>
        )}

        {debugInfo.warnings.length > 0 && (
          <div className="pt-2 border-t">
            <div className="mb-1 font-medium text-yellow-600">Warnings:</div>
            {debugInfo.warnings.map((warning, index) => (
              <div key={index} className="text-xs text-yellow-600 break-all mb-1">
                • {warning}
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="font-medium mb-2">Troubleshooting:</div>
          <ul className="space-y-1">
            <li>• Open DevTools → Application → Manifest</li>
            <li>• Check DevTools → Application → Service Workers</li>
            <li>• Try incognito window</li>
            <li>• Interact with page (click, scroll, type)</li>
            <li>• Wait 30+ seconds after first visit</li>
            {!debugInfo.notPreviouslyInstalled && (
              <li>
                • <button 
                    onClick={clearPWAData} 
                    className="text-blue-600 hover:underline"
                  >
                    Clear PWA data & reload
                  </button>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPWADebugger;