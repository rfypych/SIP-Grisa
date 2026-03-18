import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useFilterStore } from '../store/useFilterStore';
import { Select } from '../components/ui/select';
import { LayoutDashboard, CalendarDays, Users, LogOut, ScanFace, Menu, X, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminLayout() {
  const { month, year, category, setMonth, setYear, setCategory } = useFilterStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = [2024, 2025, 2026];

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/laporan', icon: CalendarDays, label: 'Matriks Laporan' },
    { path: '/admin/dataset', icon: Users, label: 'Master Data' },
    { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan' },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-emerald-600">
            <ScanFace className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">SIP Grisa</span>
          </div>
          <button 
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 shrink-0">
          <Link
            to="/kiosk"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            Ke Mode Kios
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Header with Global Filters */}
        <header className="bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-8 py-4 sm:py-0 sm:h-16 shrink-0 z-10 gap-4">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 truncate">
              {navItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar w-full sm:w-auto">
            <span className="text-sm font-medium text-slate-500 hidden sm:inline-block shrink-0">Filter:</span>
            <div className="relative shrink-0">
              <Select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-28 sm:w-32 bg-slate-50 border-slate-200 focus:ring-emerald-500"
              >
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </Select>
            </div>
            <div className="relative shrink-0">
              <Select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-20 sm:w-24 bg-slate-50 border-slate-200 focus:ring-emerald-500"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
            <div className="relative shrink-0">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-32 sm:w-36 bg-slate-50 border-slate-200 focus:ring-emerald-500"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Guru">Guru</option>
                <option value="Karyawan">Karyawan</option>
              </Select>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
