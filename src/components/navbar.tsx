"use client";

import { useRouter } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { routes } from "../lib/routes";

interface NavbarProps {
  onMenuClick: () => void;
}

interface User {
  firstName?: string;
  lastName?: string;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // ✅ Load user from localStorage asynchronously (avoids cascading render)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("user");
    if (stored) {
      queueMicrotask(() => {
        try {
          setUser(JSON.parse(stored));
        } catch (err) {
          console.error("Error parsing user data:", err);
        }
      });
    }
  }, []);

  // ✅ Listen for profile updates (safe event listener)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user") {
        queueMicrotask(() => {
          try {
            const updated = event.newValue ? JSON.parse(event.newValue) : null;
            setUser(updated);
          } catch (err) {
            console.error("Error updating user from localStorage:", err);
          }
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    router.push(routes.login);
  };

  const initials =
    (user?.firstName?.[0]?.toUpperCase() || "") +
      (user?.lastName?.[0]?.toUpperCase() || "") || "U";

  const fullName =
    user && (user.firstName || user.lastName)
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : "User";

  return (
    <nav className="flex items-center justify-between bg-neutral-900 text-white px-6 py-4 sticky top-0 z-50">
      {/* Left section - Menu + Title */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="light"
          className="text-white hover:bg-neutral-800 sm:hidden"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </Button>
      </div>

      {/* Right section - Notifications & Profile */}
      
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <Avatar
                name={initials}
                size="sm"
                color="primary"
                className="bg-primary text-white"
              />
              <span className="hidden sm:inline text-sm font-medium text-zinc-200">
                {fullName}
              </span>
            </div>
          </DropdownTrigger>

          <DropdownMenu aria-label="User Menu" variant="flat">
            <DropdownItem key="profile" onPress={() => router.push(routes.profile)}>
              Profile
            </DropdownItem>
            <DropdownItem
              key="logout"
              color="danger"
              className="text-danger"
              onPress={handleLogout}
            >
              Logout
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      
    </nav>
  );
}
