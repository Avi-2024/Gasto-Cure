import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/navigation/Sidebar';
import AppHeader from '../components/layout/AppHeader';

/**
 * DashboardLayout Component
 * Nivara operational shell providing persistent spruce sidebar navigation,
 * floating frosted header, and animated page canvas.
 */
export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile drawer automatically when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#10201F] md:flex">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Workspace */}
      <main className="min-h-screen flex-1 p-3 sm:p-5 lg:p-7 overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Floating Frosted Header */}
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* Smooth Route Transition Canvas */}
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
  );
}
