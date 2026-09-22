"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Check if device is iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIos(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIos) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosInstructions((v) => !v);
    }
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="card border border-accent/30 bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-accent text-white text-lg font-bold shadow-xs">
            📱
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              Install ESA App
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">
              Install on your home screen for quick timetable access and instant lecture reminders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-neutral-400 hover:text-neutral-600 text-sm font-bold p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {showIosInstructions ? (
          <div className="mt-3 rounded-lg bg-neutral-50 p-2.5 text-[11px] text-neutral-700 space-y-1 border border-neutral-200">
            <p className="font-semibold text-ink">To install on iPhone / iPad:</p>
            <p>1. Tap the <strong>Share</strong> button (box with arrow) at the bottom of Safari.</p>
            <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="btn-secondary !py-1 !px-2.5 !text-xs font-medium"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn-primary !py-1 !px-3 !text-xs font-semibold"
          >
            {isIos ? "How to Install" : "Install App"}
          </button>
        </div>
      </div>
    </div>
  );
}
