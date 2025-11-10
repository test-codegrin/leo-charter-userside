"use client";

import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarFixed, setIsSidebarFixed] = useState(true);

  // Ensure sidebar stays fixed on large screens
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarFixed(window.innerWidth >= 1024);
    };
    handleResize(); // set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-neutral-900 text-white">
      {/* ✅ Sidebar always visible on large screens */}
      <div
        className={`${
          isSidebarFixed ? "block" : "hidden"
        } lg:block fixed lg:relative h-full z-40`}
      >
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* ✅ Main Content Area */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* ✅ Fixed Navbar */}
        <div className="fixed top-0 left-0 lg:left-64 right-0 z-30">
          <Navbar onMenuClick={() => {}} />
        </div>

        {/* ✅ Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6 mt-[72px] bg-neutral-950 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
