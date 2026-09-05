import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from './Button';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('peoplepay_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('peoplepay_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('peoplepay_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-md bg-surface-light dark:bg-surface-dark border-2 border-ink-900 dark:border-neutral-700 rounded-neo shadow-neo dark:shadow-neo-dark p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-neo bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-ink-900 dark:text-ink-100">Privacy & Session Cookies</h4>
          <p className="text-xs text-ink-600 dark:text-ink-400 mt-1 leading-relaxed">
            PeoplePay360 uses secure essential cookies to maintain your authenticated HR session and payroll preferences.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={handleAccept}>
              Accept All
            </Button>
            <Button size="sm" variant="outline" onClick={handleDecline}>
              Essential Only
            </Button>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
