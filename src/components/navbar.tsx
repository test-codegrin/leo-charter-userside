"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@heroui/react";
import Image from "next/image";

interface NavbarProps {
  onMenuClick: () => void;
  isMobileMenuOpen: boolean;
}

export default function Navbar({ onMenuClick, isMobileMenuOpen }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-black/60 backdrop-blur-sm text-white px-6 py-3 w-full">
      {/* Left section - Menu + Logo */}
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="light"
          className="text-white hover:bg-neutral-900/50 lg:hidden"
          onPress={onMenuClick}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </Button>
        
        {/* Logo */}
        <div className="flex items-center">
          <Image 
            src="/assets/leo.png" 
            alt="Leo Charter Services" 
            width={200} 
            height={60}
            className="object-contain 2xl:ml-60 xl:ml-25 lg:ml-1"
          />
        </div>
      </div>
    </nav>
  );
}
