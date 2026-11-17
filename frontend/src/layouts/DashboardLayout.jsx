import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/navigation/Sidebar';
import AppHeader from '../components/layout/AppHeader';

/**
 * DashboardLayout Component
 * Nivara operational shell providing:
 * 1. Viewport-contained boundary (h-screen w-screen overflow-hidden) preventing body scrolling.
 * 2. Sticky desktop sidebar (h-screen) with independent vertical scroll.
 * 3. Sticky header bar pinned to the top of the main workspace.
 * 4. Dedicated scrollable content workspace (overflow-y-auto) with zero double scrollbars.
 */
export default function DashboardLayout() {
  const location = useLocation();

  // Desktop/Mobile sidebar open/close state (persisted across sessions)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nivara_sidebar_open');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 768; // default open on desktop, closed on small mobile
    }
    return true;
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nivara_sidebar_open', String(next));
      } catch {}
      return next;
    });
  };

  // Global Ctrl+B / Cmd+B keyboard shortcut to toggle sidebar On/Off
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer automatically when route changes on small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const isChatRoute = location.pathname.startsWith('/chat');
  const isPrescriptionEditor =
    location.pathname === '/prescription' ||
    location.pathname.startsWith('/prescription/');

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#F7FAF8] text-[#10201F]">
      {/* Pinned Desktop Sidebar & Mobile Drawer with On/Off Toggle */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          try {
            localStorage.setItem('nivara_sidebar_open', 'false');
          } catch {}
        }}
        onToggle={toggleSidebar}
      />

      {/* Main Content Column */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
        {/* Fixed/Sticky Top Header (Omitted in Prescription Studio to eliminate double header and maximize vertical writing space) */}
        {!isPrescriptionEditor && (
          <div className="shrink-0 relative z-[100] px-3 pt-3 sm:px-5 sm:pt-4 lg:px-7 lg:pt-5">
            <AppHeader onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
          </div>
        )}

        {/* Dedicated Workspace Content Container */}
        <main
          className={`flex-1 overflow-x-hidden ${
            isChatRoute
              ? 'overflow-y-hidden flex flex-col min-h-0 px-3 py-2 sm:px-5 sm:py-3 lg:px-7 lg:py-3'
              : isPrescriptionEditor
              ? 'overflow-y-auto px-2 pt-2 pb-32 sm:px-4 sm:pt-2.5 lg:px-6 lg:pt-3'
              : 'overflow-y-auto px-3 py-3 sm:px-5 sm:py-4 lg:px-7 lg:py-5'
          }`}
        >
          <div
            className={`mx-auto w-full max-w-[1600px] ${
              isChatRoute ? 'h-full flex-1 flex flex-col min-h-0' : isPrescriptionEditor ? 'pb-24' : 'pb-36'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.section
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={isChatRoute ? 'h-full flex-1 flex flex-col min-h-0' : undefined}
              >
                <Outlet
                  context={{
                    onMenuClick: toggleSidebar,
                    toggleSidebar,
                    sidebarOpen,
                  }}
                />
              </motion.section>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
