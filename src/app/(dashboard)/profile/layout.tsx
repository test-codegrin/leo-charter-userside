import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Account - Leo Charter Services",
  description: "View and manage your charter trips",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
