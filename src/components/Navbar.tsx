import React, { useState } from 'react';
import { NavTab } from '../types';
import { Activity, Menu, X, PlusCircle } from 'lucide-react';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickLog: () => void;
  todayWaterMl: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickLog,
  todayWaterMl,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { tab: NavTab; label: string }[] = [
    { tab: 'triage', label: 'AI Wellness Coach' },
    { tab: 'habits', label: 'Habits & Hydration' },
    { tab: 'mindfulness', label: 'Stress & Mindfulness' },
    { tab: 'analytics', label: 'Health Analytics' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Single text element with icon) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5 text-teal-50" />
          </div>
          <span 
            onClick={() => onSelectTab('triage')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Health Flow
          </span>
        </div>

        {/* Zone 2: Primary Navigation Links (Clean single-line text links) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onSelectTab(item.tab)}
                className={`py-1.5 whitespace-nowrap shrink-0 transition-colors relative cursor-pointer ${
                  isActive
                    ? 'text-teal-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-tabular hidden lg:block">
            <span>Hydration: </span>
            <span className="font-semibold text-slate-700">{todayWaterMl}</span>
            <span> / 2500 ml</span>
          </div>
          <button
            type="button"
            onClick={onOpenQuickLog}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Quick Check-in
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={onOpenQuickLog}
            aria-label="Quick Check-in"
            className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => {
                  onSelectTab(item.tab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
