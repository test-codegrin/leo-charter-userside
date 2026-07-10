"use client";

import { useState, useEffect } from "react";
import { LogOut, X, UserRound, BusFront } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Progress,
} from "@heroui/react";
import { routes } from "@/lib/routes";
import Image from "next/image";

interface SidebarProps {
  isOpen: boolean; // only controls mobile overlay
  onClose: () => void;
}

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { isOpen: isModalOpen, onOpen, onOpenChange } = useDisclosure();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();

  useEffect(() => {
    // only run on client
    if (typeof window === "undefined") return;

    // start loading
    setLoading(true);

    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setLoading(false);
      } else {
        // no stored user — still hide the placeholder and stop loading quickly
        setTimeout(() => setLoading(false), 150);
      }
    } catch (err) {
      console.error("Error reading user from localStorage:", err);
      setLoading(false);
    }

    // safety: ensure loader doesn't hang indefinitely
    const safety = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(safety);
  }, []);

  const menuItems = [
    { name: "Profile", icon: <UserRound size={20} />, path: routes.profile },
    { name: "Trips", icon: <BusFront size={20} />, path: routes.trips },
  ];

  const handleConfirmLogout = (closeModal: () => void) => {
    localStorage.clear();
    closeModal();
    router.push(routes.login);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose(); // close mobile overlay when navigating
  };

  const fullName =
    user && (user.firstName || user.lastName)
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : ""; // empty while no user

  const isActive = (path: string) => pathname === path;

  // Show full-screen loader until user is read from localStorage
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="w-full max-w-xs px-6">
          <div className="mb-4 text-center">
            <div className="flex justify-center items-center">
              <Image
                src="/leo.png"
                alt="Leo Charter Services"
                width={180}
                height={60}
                className="object-contain"
                priority
              />
            </div>{" "}
          </div>
          <Progress
            isIndeterminate
            aria-label="Loading..."
            className="max-w-xs w-full"
            size="sm"
            color="primary"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay — visible only on small screens (Tailwind) */}
      <aside
        className={`font-sans fixed left-0 top-0 z-50 h-screen w-80 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:bg-neutral-800 p-2 rounded-lg z-10"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-neutral-800 mt-12">
          <div className="ml-2">
            <p className="text-white font-medium truncate ">
              {fullName || "User"}
            </p>
            <p className="text-zinc-400 text-sm truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>

        <nav className="flex flex-col p-4 gap-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={`flex items-center gap-3 text-sm font-medium rounded-lg px-4 py-3 transition ${
                isActive(item.path)
                  ? "text-palette-primary"
                  : "text-zinc-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}

          <button
            onClick={onOpen}
            className="flex items-center gap-3 text-red-400 hover:bg-neutral-800 hover:text-red-300 rounded-lg px-4 py-3 text-sm font-medium transition mt-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Desktop sidebar — hidden on small screens */}
      <div className="hidden lg:block w-72">
        <div className="bg-black border border-divider rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-dashed border-divider">
            <p className="text-white font-medium truncate text-base mb-1">
              {fullName || "User"}
            </p>
            <p className="text-zinc-400 truncate text-sm font-sans">
              {user?.email || "user@example.com"}
            </p>
          </div>

          <nav className="flex flex-col">
            <div className="px-4 py-2 gap-2 w-full border-b border-dashed border-divider">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive(item.path)
                      ? "text-palette-primary"
                      : "text-white hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </button>
              ))}
            </div>

            {/* Logout Button */}
           <div className="px-4 py-2 w-full">
             <button
              onClick={onOpen}
              className="flex w-full cursor-pointer items-center gap-3 text-white hover:bg-neutral-800 hover:text-white rounded-xl px-4 py-3 text-sm font-medium transition"
            >
              <LogOut size={18} />
              Logout
            </button>
           </div>
          </nav>
        </div>
      </div>

      {/* Logout modal */}
      <Modal isOpen={isModalOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-lg font-semibold text-zinc-100">
                  Confirm Logout
                </span>
              </ModalHeader>

              <ModalBody>
                <p className="text-sm text-zinc-100">
                  Are you sure you want to logout? You will be redirected to the
                  sign-in page and your session will be cleared.
                </p>
              </ModalBody>

              <ModalFooter>
                <div className="flex gap-3 w-full justify-end">
                  <Button
                    color="default"
                    variant="light"
                    onPress={() => onCloseModal()}
                  >
                    Cancel
                  </Button>

                  <Button
                    color="primary"
                    onPress={() => handleConfirmLogout(onCloseModal)}
                  >
                    Logout
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
