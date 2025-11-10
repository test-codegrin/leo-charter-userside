"use client";

import { useState } from "react";
import { Home, Users, Settings, LogOut, Car } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import { routes } from "@/lib/routes";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { isOpen: isModalOpen, onOpen, onOpenChange } = useDisclosure();

  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} />, path: routes.dashboard },
    { name: "Profile", icon: <Users size={18} />, path: routes.profile },
    { name: "Trips", icon: <Car size={18} />, path: routes.trips },
  
  ];

  const handleConfirmLogout = (closeModal: () => void) => {
    // Clear storage and redirect to login (root)
    localStorage.clear();
    closeModal();
    router.push(routes.login);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-20 sm:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-full w-64 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-center p-6 mt-6">
          {/* small preview size to fit sidebar */}
          <Image src="/assets/leo.png" alt="logo" width={160} height={80} />
        </div>

        <nav className="flex flex-col p-4 gap-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className="flex cursor-pointer items-center gap-3 text-zinc-300 hover:bg-neutral-800 hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

       
      </aside>

      {/* Logout Confirmation Modal (dark theme friendly) */}
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
