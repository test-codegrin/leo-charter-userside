"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@heroui/react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface NavbarProps {
  onMenuClick: () => void;
  isMobileMenuOpen: boolean;
}

export default function Navbar({ onMenuClick, isMobileMenuOpen }: NavbarProps) {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isLarge = window.innerWidth >= 1024;
      setIsLargeScreen(isLarge);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white py-3 w-full">
  <div className="flex w-full max-w-[1200px] items-center gap-4 px-6">
    {/* Hamburger menu button only on <1200px */}
    {!isLargeScreen && (
      <Button
        isIconOnly
        variant="light"
        className="text-white hover:bg-neutral-900/50"
        onPress={onMenuClick}
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </Button>
    )}

    {/* Logo always shown */}
    <div className="flex items-center">
      <Image
        src="/leo.png"
        alt="Leo Charter Services"
        width={180}
        height={60}
        className="object-contain"
      />
    </div>
  </div>
</nav>

  );
}
