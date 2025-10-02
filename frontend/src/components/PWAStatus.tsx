import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, Wifi, WifiOff } from 'lucide-react';
import pwaManager from '@/lib/pwa';

const PWAStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    // Check if PWA is installed
    setIsInstalled(pwaManager.isAppInstalled());
    
    // Check if can install
    setCanInstall(!!pwaManager.getInstallPrompt());

    // Online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      setTimeout(() => setShowOfflineMessage(false), 5000); // Hide after 5 seconds
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for install prompt changes
    const checkInstallPrompt = () => {
      setCanInstall(!!pwaManager.getInstallPrompt());
    };

    window.addEventListener('beforeinstallprompt', checkInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', checkInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    pwaManager.installApp();
  };

  if (!isOnline && showOfflineMessage) {
    return (
      <Card className="fixed bottom-4 right-4 z-50 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="flex items-center space-x-2 p-3">
          <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm text-orange-800 dark:text-orange-200">
            You're offline. Some features may be limited.
          </span>
        </CardContent>
      </Card>
    );
  }

  if (canInstall && !isInstalled) {
    return (
      <Card className="fixed bottom-4 right-4 z-40 border-yuktor-200 bg-yuktor-50 dark:border-yuktor-800 dark:bg-yuktor-950">
        <CardContent className="flex items-center space-x-3 p-4">
          <Smartphone className="h-5 w-5 text-yuktor-600 dark:text-yuktor-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yuktor-900 dark:text-yuktor-100">
              Install Yuktor
            </p>
            <p className="text-xs text-yuktor-600 dark:text-yuktor-400">
              Get a native app experience
            </p>
          </div>
          <Button 
            onClick={handleInstall} 
            size="sm" 
            className="bg-yuktor-600 hover:bg-yuktor-700 text-white"
          >
            <Download className="h-4 w-4 mr-1" />
            Install
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show connection status in corner
  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
        isOnline 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
};

export default PWAStatus;