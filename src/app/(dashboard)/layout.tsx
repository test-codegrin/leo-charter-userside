"use client";

import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar onMenuClick={toggleSidebar} isMobileMenuOpen={isSidebarOpen} />

      {/* Sidebar always mounted; it will decide whether to render mobile overlay or desktop box */}
      <div className="w-full flex mt-4 justify-center">
        <div className="flex gap-16 max-w-[1200px] p-4 sm:p-6 lg:mt-10 w-full">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Centered content wrapper, max 1200px */}
          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
