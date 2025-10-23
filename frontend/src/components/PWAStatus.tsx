import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, X } from 'lucide-react';
import pwaManager from '@/lib/pwa';

const PWAStatus: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if PWA is installed
    setIsInstalled(pwaManager.isAppInstalled());
    
    // Check if can install
    setCanInstall(!!pwaManager.getInstallPrompt());

    // Listen for install prompt changes
    const checkInstallPrompt = () => {
      setCanInstall(!!pwaManager.getInstallPrompt());
    };
    
    // Listen to both native and custom events
    window.addEventListener('beforeinstallprompt', checkInstallPrompt);
    window.addEventListener('pwa-install-prompt-change', checkInstallPrompt as EventListener);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallPrompt);
      window.removeEventListener('pwa-install-prompt-change', checkInstallPrompt as EventListener);
    };
  }, []);

  const handleInstall = () => {
    pwaManager.installApp();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't render anything if app is already installed or dismissed
  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 z-50 max-w-sm border-yuktor-200 bg-yuktor-50 dark:border-yuktor-800 dark:bg-yuktor-950">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Smartphone className="h-4 w-4 text-yuktor-600 dark:text-yuktor-400" />
            <div>
              <div className="text-sm font-medium text-yuktor-900 dark:text-yuktor-100">
                Install Yuktor
              </div>
              <div className="text-xs text-yuktor-600 dark:text-yuktor-400">
                Get a native app experience
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-yuktor-600 hover:text-yuktor-800 dark:text-yuktor-400 dark:hover:text-yuktor-200"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          onClick={handleInstall}
          className="w-full mt-3 bg-yuktor-600 hover:bg-yuktor-700 text-white"
          size="sm"
        >
          <Download className="h-4 w-4 mr-1" />
          Install App
        </Button>
      </CardContent>
    </Card>
  );
};

export default PWAStatus;