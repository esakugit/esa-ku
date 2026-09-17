"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3500;

/**
 * Wraps the whole app (see app/layout.tsx) so any client component can call
 * useToast() and reach the same toast stack — one provider, not a
 * per-component container, so it works the same on every page without each
 * screen having to remember to render its own <ToastContainer>.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: string) => {
    setItems((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${nextId.current++}`;
    setItems((cur) => [...cur, { id, type, title, message }]);
  }, []);

  const success = useCallback((title: string, message?: string) => showToast("success", title, message), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast("error", title, message), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast("info", title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <ToastContainer items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * Fire-and-forget toast notifications. Falls back to a no-op if called
 * outside <ToastProvider> so a component can't crash a page that's missing it.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { success: () => {}, error: () => {}, info: () => {} };
  }
  return ctx;
}

function ToastContainer({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div aria-label="Notifications" className="pointer-events-none fixed bottom-6 right-4 z-[9999] flex flex-col items-end gap-2.5">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastCard item={item} onDismiss={() => onDismiss(item.id)} />
        </div>
      ))}
    </div>
  );
}

const ICON: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  ),
};

const STYLE: Record<ToastType, { wrap: string; icon: string; bar: string }> = {
  success: {
    wrap: "bg-white border border-brandgreen/25 shadow-lg shadow-brandgreen/10",
    icon: "bg-brandgreen-soft text-brandgreen",
    bar: "bg-brandgreen",
  },
  error: {
    wrap: "bg-white border border-red-200 shadow-lg shadow-red-500/10",
    icon: "bg-red-50 text-red-600",
    bar: "bg-red-500",
  },
  info: {
    wrap: "bg-white border border-accent/20 shadow-lg shadow-accent/10",
    icon: "bg-accent-soft text-accent",
    bar: "bg-accent",
  },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 10);
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setLeaving(true);
    setTimeout(onDismiss, 320);
  }

  const s = STYLE[item.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={dismiss}
      className={`relative w-80 max-w-[calc(100vw-2rem)] cursor-pointer overflow-hidden rounded-2xl ${s.wrap} transition-all duration-300 ease-out ${
        leaving || !visible ? "translate-x-8 scale-95 opacity-0" : "translate-x-0 scale-100 opacity-100"
      }`}
    >
      <div
        className={`absolute left-0 top-0 h-0.5 ${s.bar} rounded-full`}
        style={{ animation: visible && !leaving ? "toastProgress 3.5s linear forwards" : "none", width: "100%" }}
      />

      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full ${s.icon}`}>
          {ICON[item.type]}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-ink">{item.title}</p>
          {item.message && <p className="mt-0.5 text-xs leading-snug text-neutral-500">{item.message}</p>}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          aria-label="Dismiss"
          className="mt-0.5 flex-none text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
