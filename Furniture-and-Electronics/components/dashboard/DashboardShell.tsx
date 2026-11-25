"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import NotificationBell from "@/components/dashboard/NotificationBell";
import DepartmentSwitcher from "@/components/dashboard/department/DepartmentSwitcher";

interface DashboardShellProps {
  isOwner: boolean;
  welcomeName: string;
  children: React.ReactNode;
}

export default function DashboardShell({
  isOwner,
  welcomeName,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <Sidebar isOwner={isOwner} idPrefix="desktop" className="hidden lg:flex" />

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 flex"
            >
              <div className="relative">
                <Sidebar
                  isOwner={isOwner}
                  idPrefix="mobile"
                  onPageChange={() => setMobileMenuOpen(false)}
                  className="h-full shadow-2xl"
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="absolute top-4 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="sticky top-0 z-40 h-14 sm:h-16 bg-[#0B1421]/95 backdrop-blur-md text-white shadow-sm flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-slate-200 hover:bg-white/[0.15] active:scale-95 transition"
            >
              <Menu className="h-5 w-5" />
            </button>
            <DepartmentSwitcher />
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-4 shrink-0">
            <span className="text-sm text-slate-300 font-medium hidden md:inline">
              {welcomeName}
            </span>
            <NotificationBell />
            <Link
              href="/api/auth/signout"
              className="text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 transition"
            >
              Logout
            </Link>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-5 lg:p-6 relative">{children}</main>
      </div>
    </>
  );
}
