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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile drawer automatically when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#F7FAF8] text-[#10201F]">
      {/* Pinned Desktop Sidebar & Mobile Drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Column */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
        {/* Fixed/Sticky Top Header */}
        <div className="shrink-0 z-30 px-3 pt-3 sm:px-5 sm:pt-4 lg:px-7 lg:pt-5">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {/* Dedicated Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-5 sm:py-4 lg:px-7 lg:py-5">
          <div className="mx-auto w-full max-w-[1600px] pb-12">
            <AnimatePresence mode="wait">
              <motion.section
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.section>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
