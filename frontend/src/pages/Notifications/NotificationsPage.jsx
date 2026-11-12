import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  MessageCircle,
  Clock3,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Filter,
  CheckCheck,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { notificationsService } from '../../services/notificationsService';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Alerts' },
  { id: 'FOLLOW_UP', label: 'Follow-Ups' },
  { id: 'WHATSAPP', label: 'WhatsApp Replies' },
  { id: 'QUEUE', label: 'Waiting Queue' },
  { id: 'SYSTEM', label: 'System' },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');

  const loadNotifications = () => {
    setNotifications(notificationsService.getAll());
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = () => {
    notificationsService.markAllAsRead();
    loadNotifications();
  };

  const handleClearAll = () => {
    notificationsService.clearAll();
    loadNotifications();
  };

  const handleItemClick = (notif) => {
    notificationsService.markAsRead(notif.id);
    loadNotifications();
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleDismissItem = (e, notifId) => {
    e.stopPropagation();
    notificationsService.dismiss(notifId);
    loadNotifications();
  };

  const filtered = notifications.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.category === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconForCategory = (category) => {
    switch (category) {
      case 'FOLLOW_UP':
        return <CalendarClock size={16} className="text-amber-600" />;
      case 'WHATSAPP':
        return <MessageCircle size={16} className="text-emerald-600" />;
      case 'QUEUE':
        return <Clock3 size={16} className="text-[#287C75]" />;
      default:
        return <ShieldCheck size={16} className="text-teal-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-nivara-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#287C75] border border-teal-100 shadow-sm">
              <Bell size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-[#10201F]">
                  Clinical Notifications & Alerts
                </h1>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-xs font-bold">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4E6460] mt-0.5">
                Real-time follow-up reminders, WhatsApp replies, and patient waiting queue alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#10201F] hover:bg-[#F7FAF8] transition cursor-pointer"
              >
                <CheckCheck size={14} className="text-emerald-600" />
                Mark All Read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                <Trash2 size={13} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Categories Tab Strip */}
        <div className="mt-6 flex flex-wrap border-b border-[#D9E6E2] gap-1">
          {CATEGORY_TABS.map((tab) => {
            const count = notifications.filter(
              (n) => tab.id === 'ALL' || n.category === tab.id
            ).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 pt-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all rounded-t-lg cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#287C75] text-[#123A3A] bg-teal-50/50'
                    : 'border-transparent text-[#7D908C] hover:text-[#10201F] hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-[#287C75] text-white'
                      : 'bg-[#F7FAF8] text-[#7D908C] border border-[#D9E6E2]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-nivara-xs">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-12 text-center">
            <CheckCircle2 size={36} className="mx-auto text-[#2E7D5B]" />
            <p className="mt-2 text-sm font-semibold text-[#10201F]">No notifications here</p>
            <p className="mt-1 text-xs text-[#4E6460]">
              You're all caught up! New reminders, queue arrivals, and patient replies will appear here.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#287C75] hover:underline"
            >
              <ArrowLeft size={13} />
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((item) => (
              <li
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group rounded-2xl border p-4 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !item.read
                    ? 'border-teal-200 bg-teal-50/30 hover:border-teal-300 hover:bg-teal-50/60 shadow-2xs'
                    : 'border-[#D9E6E2] bg-white hover:border-[#287C75]/40 hover:bg-[#F7FAF8]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#D9E6E2] shadow-2xs mt-0.5">
                    {getIconForCategory(item.category)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-heading ${!item.read ? 'font-bold text-[#10201F]' : 'font-semibold text-[#4E6460]'}`}>
                        {item.title}
                      </p>
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-[#C9A45C]" aria-label="Unread" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#4E6460] line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {item.actionLabel && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-[#287C75] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs group-hover:bg-[#20635e] transition">
                      {item.actionLabel}
                      <ChevronRight size={13} />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDismissItem(e, item.id)}
                    className="p-1.5 text-[#7D908C] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Dismiss notification"
                    aria-label="Dismiss notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
