'use client';

import { useEffect, useState } from 'react';

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      // Show banner after 3s on wisdom pages
      if (window.location.pathname.includes('wisdom')) {
        setTimeout(() => setShow(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setShow(false);
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#1B3A6B] border border-[#F4A261]/30 rounded-2xl p-4 shadow-2xl">
        <button onClick={() => setShow(false)} className="absolute top-3 right-3 text-white/40 hover:text-white text-lg">×</button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4A261] flex items-center justify-center text-xl flex-shrink-0">🧘</div>
          <div>
            <p className="text-white font-bold text-sm">Install SthirMind</p>
            <p className="text-[#8B9BB4] text-xs">Add to home screen for offline access</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={install} className="flex-1 bg-[#F4A261] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#E8895A] transition-colors">
            Install App
          </button>
          <button onClick={() => setShow(false)} className="px-4 bg-white/10 text-white text-sm py-2.5 rounded-xl">
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
