'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    deepLink?: string;
    createdAt: string;
}

export default function NotificationBell() {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (e) { }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: poll every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await fetch(`${API}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        await fetch(`${API}/notifications/read-all`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-white/5"
            >
                <div className="text-lg">🔔</div>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0a0a0a]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-[#111] border border-white/[0.08] rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">{unreadCount} non lues</span>}
                        </h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-[10px] text-gray-500 hover:text-white transition">
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Aucune notification
                            </div>
                        ) : (
                            notifications.map(n => (
                                <Link
                                    key={n.id}
                                    href={n.deepLink || '#'}
                                    onClick={() => { if (!n.isRead) markAsRead(n.id); setOpen(false); }}
                                    className={`block px-4 py-3 border-b border-white/[0.02] hover:bg-white/[0.03] transition ${!n.isRead ? 'bg-white/[0.02]' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            {!n.isRead ? <div className="w-2 h-2 rounded-full bg-[#14B53A]" /> : <div className="w-2 h-2 rounded-full bg-transparent" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm ${!n.isRead ? 'text-white font-medium' : 'text-gray-300'}`}>{n.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                                            <p className="text-[10px] text-gray-600 mt-1">
                                                {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
