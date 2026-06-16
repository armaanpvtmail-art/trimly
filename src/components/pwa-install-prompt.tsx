'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Install Trimly</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Add Trimly to your home screen for quick access.</p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="ml-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => setShowPrompt(false)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Not now
        </Button>
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-1 gap-2"
        >
          <Download size={16} />
          Install
        </Button>
      </div>
    </div>
  );
}
