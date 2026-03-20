import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, CalendarDays, Users, LogOut, ScanFace, Menu, X, Settings, UserCog, ShieldCheck, Calendar, History, ClipboardList, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout, setUser } = useAuthStore();

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['superadmin', 'admin'] },
    { path: '/admin/laporan', icon: CalendarDays, label: 'Matriks Laporan', roles: ['superadmin', 'admin'] },
    { path: '/admin/dataset', icon: Users, label: 'Master Data', roles: ['superadmin', 'admin'] },
    { path: '/admin/holidays', icon: Calendar, label: 'Hari Libur', roles: ['superadmin', 'admin'] },
    { path: '/admin/attendance-logs', icon: ClipboardList, label: 'Log Kehadiran', roles: ['superadmin'] },
    { path: '/admin/logs', icon: History, label: 'Log Sistem', roles: ['superadmin'] },
    { path: '/admin/users', icon: UserCog, label: 'Manajemen Admin', roles: ['superadmin'] },
    { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan', roles: ['superadmin', 'admin'] },
    { path: '/admin/docs', icon: BookOpen, label: 'Dokumentasi', roles: ['superadmin'] },
  ].filter(item => user?.role && item.roles.includes(user.role as any));

  useEffect(() => {
    // Fetch user profile to ensure sync
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setUser(await res.json());
        } else if (res.status === 401) {
          logout();
          navigate('/login');
        }
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
    };
    if (token) fetchMe();

    // Re-route kiosk account to kiosk page if they try to access admin
    if (user?.role === 'kiosk' && !location.pathname.startsWith('/kiosk')) {
      navigate('/kiosk');
    }
  }, [token, setUser, logout, navigate, user?.role, location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Anda telah keluar dari sistem.");
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* Sidebar (Desktop Only) */}
      <aside className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex-col"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-emerald-600">
            <ScanFace className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">SIP Grisa</span>
          </div>
        </div>
        
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.username || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> 
                  {user?.role === 'superadmin' ? 'Super Admin' : 
                   user?.role === 'admin' ? 'Administrator' : 'Petugas Gerbang'}
                </p>
              </div>
           </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700 font-bold ring-1 ring-emerald-100" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 shrink-0 space-y-1">
          <Link
            to="/kiosk"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            Ke Mode Kios
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen lg:ml-64 pb-16 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-8 py-3 sm:py-0 sm:h-16 shrink-0 z-10 gap-3 sm:gap-4 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-emerald-600 lg:hidden">
              <ScanFace className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 truncate">
              {navItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-50">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-2 flex justify-around items-center h-16 safe-area-pb">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-16 gap-1 rounded-xl transition-colors duration-200 p-1",
                isActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={cn("p-1.5 rounded-full", isActive && "bg-emerald-50")}>
                <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-slate-500")} />
              </div>
              <span className="text-[10px] font-semibold text-center leading-none truncate w-full">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
