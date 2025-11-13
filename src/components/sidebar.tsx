"use client";

import { useState, useEffect } from "react";
import { LogOut, X, UserRound, BusFront } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Avatar,
} from "@heroui/react";
import { routes } from "@/lib/routes";

interface SidebarProps {
  isOpen: boolean;
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

  const menuItems = [
    { name: "Profile", icon: <UserRound size={20} />, path: routes.profile },
    { name: "Trips", icon: <BusFront size={20} />, path: routes.trips }
  ];

  const handleConfirmLogout = (closeModal: () => void) => {
    localStorage.clear();
    closeModal();
    router.push(routes.login);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const initials =
    (user?.firstName?.[0]?.toUpperCase() || "") +
      (user?.lastName?.[0]?.toUpperCase() || "") || "A";

  const fullName =
    user && (user.firstName || user.lastName)
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : "User";

  return (
    <>

      {/* Mobile Sidebar (Full Screen Overlay) */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-80 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:bg-neutral-800 p-2 rounded-lg z-10"
        >
          <X size={20} />
        </button>

        {/* User Profile Section */}
        <div className="p-6 border-b border-neutral-800 mt-12">
          <div className="flex items-center gap-4">
            <Avatar
              className="bg-neutral-700 text-white text-xl"
              name={initials}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{fullName}</p>
              <p className="text-zinc-400 text-sm truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col p-4 gap-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className="flex cursor-pointer items-center gap-3 text-zinc-300 hover:bg-neutral-800 hover:text-white rounded-lg px-4 py-3 text-sm font-medium transition"
            >
              {item.icon}
              {item.name}
            </button>
          ))}

          {/* Logout Button */}
          <button
            onClick={onOpen}
            className="flex cursor-pointer items-center gap-3 text-red-400 hover:bg-neutral-800 hover:text-red-300 rounded-lg px-4 py-3 text-sm font-medium transition mt-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Desktop Sidebar Box */}
      <div className="hidden lg:block lg:w-2/3 h-fit mt-10">
        <div className="bg-black border border-neutral-800 rounded-3xl overflow-hidden">
          {/* User Profile Section */}
          <div className="p-6 border-b border-dashed border-neutral-700">
            <div className="flex items-center gap-4">
              <Avatar
                className="bg-neutral-700 text-white text-xl"
                name={initials}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{fullName}</p>
                <p className="text-zinc-400 text-sm truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col">
            <div className="p-4 gap-2 w-full border-b border-dashed border-neutral-700">
              {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className="flex cursor-pointer w-full items-center gap-3 text-zinc-300 hover:bg-neutral-800 hover:text-white rounded-xl px-4 py-3 text-sm font-medium transition"
              >
                {item.icon}
                {item.name}
              </button>
            ))}
            </div>

            {/* Logout Button */}
           <div className="p-4 w-full">
             <button
              onClick={onOpen}
              className="flex w-full cursor-pointer items-center gap-3 text-red-400 hover:bg-neutral-800 hover:text-red-300 rounded-xl px-4 py-3 text-sm font-medium transition"
            >
              <LogOut size={18} />
              Logout
            </button>
           </div>
          </nav>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isModalOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-lg font-semibold">Confirm Logout</span>
              </ModalHeader>

              <ModalBody>
                <p className="text-sm text-zinc-300">
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
                    color="danger"
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
