'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createPageUrl } from './lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Truck,
  Tag,
  Sparkles,
  FileText,
  Menu,
  ChevronRight,
  LogOut,
  Building2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { OrganizationProvider, useOrganization } from './components/shared/OrganizationContext';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Ingresos', icon: TrendingUp, page: 'Incomes' },
  { name: 'Gastos', icon: TrendingDown, page: 'Expenses' },
  { name: 'Caja y Bancos', icon: Wallet, page: 'CashBank' },
  { name: 'Clientes', icon: Users, page: 'Customers' },
  { name: 'Proveedores', icon: Truck, page: 'Suppliers' },
  { name: 'Categorías', icon: Tag, page: 'Categories' },
  { name: 'Dashboard IA', icon: Sparkles, page: 'AIDashboard' },
  { name: 'Reportes IA', icon: FileText, page: 'AIReports' },
  { name: 'Organización', icon: Building2, page: 'Organizations', adminOnly: true },
];

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useOrganization();

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <style>{`
        :root {
          --quma-teal: #0d9488;
          --quma-teal-light: #14b8a6;
          --quma-dark: #0f172a;
          --quma-dark-light: #1e293b;
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0f172a] text-white flex flex-col z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f631d6134921e5834f04/d54851717_Recurso62x.png"
            alt="QUMA Finance"
            className="h-12 w-auto"
          />
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const isActive = currentPageName === item.page;
            const href = createPageUrl(item.page);
            return (
              <Link
                key={item.page}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon
                  className={`w-[18px] h-[18px] ${
                    isActive
                      ? 'text-teal-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                {item.name}
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-teal-400/60" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f631d6134921e5834f04/6bc1ae2e6_Recurso52x.png"
            alt="QUMA Finance"
            className="h-8 w-auto"
          />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <OrganizationProvider>
      <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
    </OrganizationProvider>
  );
}
