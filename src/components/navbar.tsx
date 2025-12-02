"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@heroui/react";
import Image from "next/image";
import { images } from "@/lib/assets";

interface NavbarProps {
  onMenuClick: () => void;
  isMobileMenuOpen: boolean;
}

export default function Navbar({ onMenuClick, isMobileMenuOpen }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white py-3 w-full">
      <div className="flex w-full max-w-[1200px] items-center gap-4 px-6">
        {/* Hamburger menu button — visible only on small screens (hidden on lg and up) */}
        <div className="lg:hidden">
          <Button
            isIconOnly
            variant="light"
            className="text-white hover:bg-neutral-900/50"
            onPress={onMenuClick}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </Button>
        </div>

        {/* Logo: always visible */}
        <div className="flex items-center">
          <Image
            src={images.logo}
            alt="Leo Charter Services Logo"
            width={180}
            height={60}
            className="object-contain"
            unoptimized
            priority
          />
        </div>

        {/* optional spacer to center logo (keeps layout stable) */}
        <div className="flex-1" />
      </div>
    </nav>
  );
}
