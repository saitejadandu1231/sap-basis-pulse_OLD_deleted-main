import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Download, RefreshCw, Zap } from 'lucide-react';

const PWADebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState({
    serviceWorkerSupported: false,
    serviceWorkerRegistered: false,
    manifestDetected: false,
    httpsOrLocalhost: false,
    installPromptAvailable: false,
    isStandalone: false,
    iconsAccessible: false,
    hasUserGesture: false,
    hasMinimalUI: false,
    notPreviouslyInstalled: true,
    userAgent: '',
    errors: [] as string[]
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkPWAStatus = async () => {
      const info = {
        serviceWorkerSupported: 'serviceWorker' in navigator,
        serviceWorkerRegistered: false,
        manifestDetected: false,
        httpsOrLocalhost: location.protocol === 'https:' || location.hostname === 'localhost',
        installPromptAvailable: false,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone,
        userAgent: navigator.userAgent,
        errors: [] as string[]
      };

      // Check service worker registration
      if (info.serviceWorkerSupported) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          info.serviceWorkerRegistered = !!registration;
          if (!registration) {
            info.errors.push('Service Worker not registered - check console for SW registration errors');
          }
        } catch (error) {
          info.errors.push(`Service Worker error: ${error}`);
        }
      } else {
        info.errors.push('Service Worker not supported in this browser');
      }

      // Check manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      info.manifestDetected = !!manifestLink;
      
      if (manifestLink) {
        try {
          const manifestUrl = (manifestLink as HTMLLinkElement).href;
          const response = await fetch(manifestUrl);
          if (!response.ok) {
            info.errors.push(`Manifest failed to load: ${response.status} ${response.statusText}`);
          } else {
            const manifest = await response.json();
            console.log('Manifest loaded:', manifest);
            
            // Check manifest requirements
            if (!manifest.name || !manifest.short_name) {
              info.errors.push('Manifest missing name or short_name');
            }
            if (!manifest.start_url) {
              info.errors.push('Manifest missing start_url');
            }
            if (!manifest.display || manifest.display === 'browser') {
              info.errors.push('Manifest display should be standalone, fullscreen, or minimal-ui');
            }
            if (!manifest.icons || manifest.icons.length === 0) {
              info.errors.push('Manifest missing icons');
            } else {
              // Check if icons are accessible
              for (const icon of manifest.icons) {
                try {
                  const iconResponse = await fetch(icon.src);
                  if (!iconResponse.ok) {
                    info.errors.push(`Icon not accessible: ${icon.src}`);
                  }
                } catch (iconError) {
                  info.errors.push(`Icon fetch failed: ${icon.src} - ${iconError}`);
                }
              }
            }
          }
        } catch (error) {
          info.errors.push(`Manifest error: ${error}`);
        }
      } else {
        info.errors.push('No manifest link found in HTML');
      }

      // Check PWA criteria
      if (!info.httpsOrLocalhost) {
        info.errors.push('PWA requires HTTPS or localhost');
      }

      setDebugInfo(info);
    };

    checkPWAStatus();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎉 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setDebugInfo(prev => ({ ...prev, installPromptAvailable: true }));
    };

    // Force check for install prompt availability after a delay
    const forceInstallPromptCheck = () => {
      setTimeout(() => {
        // Simulate user engagement by dispatching a few events
        const events = ['click', 'keydown', 'touchstart'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          document.body.dispatchEvent(event);
        });
        
        // Check if prompt becomes available after engagement
        setTimeout(() => {
          if (deferredPrompt) {
            setDebugInfo(prev => ({ ...prev, installPromptAvailable: true }));
          } else {
            console.log('Install prompt still not available after engagement simulation');
          }
        }, 2000);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    forceInstallPromptCheck();

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

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;

  return (
    <Card className="fixed top-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          PWA Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
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
          <span>Install Prompt Available:</span>
          <StatusIcon status={debugInfo.installPromptAvailable} />
        </div>
        
        <div className="flex items-center justify-between">
          <span>Running as PWA:</span>
          <StatusIcon status={debugInfo.isStandalone} />
        </div>

        {debugInfo.installPromptAvailable && (
          <Button onClick={handleInstallClick} size="sm" className="w-full">
            <Download className="h-3 w-3 mr-1" />
            Install App
          </Button>
        )}

        {/* Force install button for testing */}
        {!debugInfo.installPromptAvailable && (
          <div className="space-y-2">
            <Button 
              onClick={() => {
                // Try to force trigger install prompt
                window.dispatchEvent(new Event('beforeinstallprompt'));
              }} 
              size="sm" 
              variant="outline" 
              className="w-full"
            >
              🔧 Force Check Install Prompt
            </Button>
            <div className="text-xs text-muted-foreground">
              If no install prompt appears after meeting all requirements, try:
              <br />• Visit multiple pages
              <br />• Wait 30+ seconds on page
              <br />• Interact with the app (click, scroll)
              <br />• Clear browser data and retry
            </div>
          </div>
        )}

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
              <div key={index} className="text-xs text-red-600 break-all">
                {error}
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <strong>Troubleshooting:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check DevTools → Application → Manifest</li>
            <li>Check DevTools → Application → Service Workers</li>
            <li>Refresh page and wait 30 seconds</li>
            <li>Try incognito mode</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWADebugger;