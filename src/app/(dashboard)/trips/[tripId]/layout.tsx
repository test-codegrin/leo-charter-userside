import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trips Details | Account - Leo Charter Services",
  description: "View your charter trip details",
};

export default function TripDetailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
