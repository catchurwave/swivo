import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type ToastKind = 'error' | 'success' | 'info' | 'warning';
export type Toast = { id: number; kind: ToastKind; title?: string; message: string; ttl: number };

type ToastApi = {
  push: (t: Omit<Toast, 'id' | 'ttl'> & { ttl?: number }) => number;
  pushMany: (ts: Array<Omit<Toast, 'id' | 'ttl'> & { ttl?: number }>) => void;
  dismiss: (id: number) => void;
};

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((arr) => arr.filter((t) => t.id !== id)), []);

  const push: ToastApi['push'] = useCallback((t) => {
    const id = Date.now() + Math.random();
    const toast: Toast = { id, kind: t.kind, title: t.title, message: t.message, ttl: t.ttl ?? 5000 };
    setToasts((arr) => [...arr, toast]);
    if (toast.ttl > 0) setTimeout(() => dismiss(id), toast.ttl);
    return id;
  }, [dismiss]);

  const pushMany: ToastApi['pushMany'] = useCallback((ts) => { ts.forEach(push); }, [push]);

  return (
    <Ctx.Provider value={{ push, pushMany, dismiss }}>
      {children}
      <ToastHost toasts={toasts} dismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) {
    // Allow optional usage outside provider: noop returns
    return {
      push: () => 0,
      pushMany: () => undefined,
      dismiss: () => undefined,
    };
  }
  return v;
}

function ToastHost({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex w-[min(380px,calc(100%-2rem))] flex-col gap-2" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  const [enter, setEnter] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setEnter(true)); }, []);
  const cfg = STYLES[t.kind];
  return (
    <div
      role={t.kind === 'error' ? 'alert' : 'status'}
      aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
      className={`pointer-events-auto overflow-hidden rounded-xl border shadow-elevated backdrop-blur transition-all duration-300 ${cfg.cls} ${enter ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="text-lg leading-none" aria-hidden>{cfg.icon}</span>
        <div className="min-w-0 flex-1">
          {t.title && <p className="text-sm font-semibold">{t.title}</p>}
          <p className="whitespace-pre-line text-sm leading-snug">{t.message}</p>
        </div>
        <button onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100" aria-label="Fermer">✕</button>
      </div>
    </div>
  );
}

const STYLES: Record<ToastKind, { cls: string; icon: string }> = {
  error:   { cls: 'border-rose-300 bg-rose-50 text-rose-900',         icon: '⚠️' },
  warning: { cls: 'border-amber-300 bg-amber-50 text-amber-900',      icon: '⚠️' },
  success: { cls: 'border-emerald-300 bg-emerald-50 text-emerald-900', icon: '✅' },
  info:    { cls: 'border-primary-300 bg-primary-50 text-primary-900', icon: 'ℹ️' },
};
