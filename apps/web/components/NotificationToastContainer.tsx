'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  NotificationItem,
  markNotificationRead,
} from '@/lib/notifications';
import {
  Bell,
  CheckCircle2,
  ChefHat,
  AlertTriangle,
  Boxes,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react';

export function NotificationToastContainer() {
  const router = useRouter();
  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const handleNotification = (e: any) => {
      const item: NotificationItem = e.detail;
      if (!item) return;

      setToasts((prev) => [item, ...prev.filter((t) => t.id !== item.id)].slice(0, 4));

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== item.id));
      }, 6000);
    };

    window.addEventListener('nitsuh_inapp_notification', handleNotification);
    return () => {
      window.removeEventListener('nitsuh_inapp_notification', handleNotification);
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    markNotificationRead(id);
  };

  const handleAction = (item: NotificationItem) => {
    dismiss(item.id);
    if (item.url) {
      router.push(item.url);
    }
  };

  if (toasts.length === 0) return null;

  const getStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ORDER_READY':
        return {
          border: 'border-emerald-500/60',
          bg: 'bg-emerald-950 text-white',
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
        };
      case 'WAITER_NOTE':
        return {
          border: 'border-amber-500/60',
          bg: 'bg-amber-950 text-white',
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          icon: FileText,
          iconColor: 'text-amber-400',
        };
      case 'ORDER_CREATED':
        return {
          border: 'border-blue-500/60',
          bg: 'bg-slate-950 text-white',
          badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
          icon: ChefHat,
          iconColor: 'text-blue-400',
        };
      case 'STOCK_ALERT':
        return {
          border: 'border-rose-500/60',
          bg: 'bg-rose-950 text-white',
          badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
          icon: AlertTriangle,
          iconColor: 'text-rose-400',
        };
      case 'TRANSFER_ALERT':
        return {
          border: 'border-purple-500/60',
          bg: 'bg-purple-950 text-white',
          badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
          icon: Boxes,
          iconColor: 'text-purple-400',
        };
      default:
        return {
          border: 'border-stone-700',
          bg: 'bg-stone-900 text-white',
          badge: 'bg-stone-800 text-stone-300 border border-stone-700',
          icon: Bell,
          iconColor: 'text-stone-300',
        };
    }
  };

  return (
    <div className="fixed top-4 right-3 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const style = getStyle(toast.type);
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-3.5 shadow-2xl border ${style.border} ${style.bg} backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 transition-all`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/10">
                <Icon className={`w-4 h-4 ${style.iconColor}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-heading font-black text-xs sm:text-sm leading-tight text-white">
                    {toast.title}
                  </span>
                  {toast.tableNumber && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${style.badge}`}>
                      {toast.tableNumber}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-200 leading-snug line-clamp-2">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {toast.url && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleAction(toast)}
                  className="px-3 py-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-[11px] font-black transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3 text-white" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
