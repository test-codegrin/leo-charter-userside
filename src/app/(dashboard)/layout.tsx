"use client";

import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // desktop layout from 1200px and up
      const isLarge = window.innerWidth >= 1024;
      setIsLargeScreen(isLarge);
      if (isLarge) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar onMenuClick={toggleSidebar} isMobileMenuOpen={isSidebarOpen} />

      {/* Mobile Sidebar (<1200) */}
      {!isLargeScreen && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Centered content wrapper, max 1200px */}
      <div className="w-full flex mt-4 justify-center">
        <div className="flex gap-16 max-w-[1200px] p-4 sm:p-6 lg:mt-10 w-full">
          {/* Desktop Sidebar (>=1200) */}
          <div className={isLargeScreen ? "flex justify-end" : "hidden"}>
            <Sidebar isOpen={true} onClose={() => {}} />
          </div>

          {/* Main Content */}
          <div className={isLargeScreen ? "flex-1" : "flex-1 w-full"}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
