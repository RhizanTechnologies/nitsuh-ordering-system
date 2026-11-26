'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  ChefHat,
  AlertTriangle,
  Boxes,
  FileText,
  CheckCheck,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  NotificationItem,
  getStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  requestNotificationPermission,
  getNotificationPermission,
} from '@/lib/notifications';
import { useTranslation } from '@/lib/i18n';

export function NotificationCenter() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const refresh = () => {
    setNotifications(getStoredNotifications());
    setPermission(getNotificationPermission());
  };

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener('nitsuh_inapp_notification', handleUpdate);
    window.addEventListener('nitsuh_notifications_updated', handleUpdate);

    return () => {
      window.removeEventListener('nitsuh_inapp_notification', handleUpdate);
      window.removeEventListener('nitsuh_notifications_updated', handleUpdate);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleItemClick = (item: NotificationItem) => {
    markNotificationRead(item.id);
    setIsOpen(false);
    if (item.url) {
      router.push(item.url);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ORDER_READY':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'WAITER_NOTE':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'ORDER_CREATED':
        return <ChefHat className="w-4 h-4 text-blue-600" />;
      case 'STOCK_ALERT':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'TRANSFER_ALERT':
        return <Boxes className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-stone-600" />;
    }
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return lang === 'am' ? 'አሁን' : 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) refresh();
        }}
        className="relative p-2 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 transition cursor-pointer active:scale-95"
        title="Notifications & Activity Alerts"
      >
        <Bell className="w-4 h-4 text-stone-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-stone-200 p-4 z-50 text-stone-900 animate-in fade-in zoom-in-95 duration-150 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-sm text-stone-900">
                  {lang === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {unreadCount} {lang === 'am' ? 'አዲስ' : 'new'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      markAllNotificationsRead();
                      refresh();
                    }}
                    className="p-1 rounded-lg text-stone-500 hover:text-emerald-700 hover:bg-stone-100 transition cursor-pointer text-[11px] font-bold inline-flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{lang === 'am' ? 'ሁሉንም አንብብ' : 'Read all'}</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAllNotifications();
                      refresh();
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition cursor-pointer"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* PWA / Web Push Permission Prompt Banner */}
            {permission !== 'granted' && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'am' ? 'የPWA ማሳወቂያዎችን ያብሩ' : 'Enable PWA Alerts'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    {lang === 'am' ? 'ትዕዛዞች ሲዘጋጁ ወዲያውኑ ማሳወቂያ ይቀበሉ' : 'Get instant alerts when orders are ready or placed'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleEnablePush}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] shrink-0 shadow-xs cursor-pointer active:scale-95"
                >
                  {lang === 'am' ? 'ፍቀድ' : 'Enable'}
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto no-scrollbar pr-0.5">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">
                    {lang === 'am' ? 'ምንም ማሳወቂያዎች የሉም' : 'No notifications yet'}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {lang === 'am' ? 'አዲስ እንቅስቃሴዎች እዚህ ይታያሉ' : 'Order and kitchen alerts will appear here'}
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-start gap-2.5 text-xs ${
                      item.read
                        ? 'bg-stone-50 border-stone-200/70 hover:bg-stone-100/70 opacity-80'
                        : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      {getIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-heading font-black text-stone-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium shrink-0">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-snug line-clamp-2">
                        {item.message}
                      </p>
                    </div>

                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
