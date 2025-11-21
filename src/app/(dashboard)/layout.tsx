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
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar - Sticky at Top with Blur Effect */}
      <Navbar onMenuClick={toggleSidebar} isMobileMenuOpen={isSidebarOpen} />

      {/* Mobile Sidebar */}
      {isLargeScreen ? null: (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      {/* Content Area Below Navbar */}
      <div className="flex gap-12 p-6 xl:px-65">
        {/* Desktop Sidebar - 30% width */}
        <div className={`${isLargeScreen ? "" : "hidden"} lg:flex justify-end `}>
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>

        {/* Main Content - 70% width on desktop, full width on mobile */}
        <div className={`flex-1 ${isLargeScreen ? "" : "w-full "} `}>
          {children}
        </div>
      </div>
    </div>
  );
}
