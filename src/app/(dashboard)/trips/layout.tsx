import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trips | Account - Leo Charter Services",
  description: "View your charter trips",
};

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
