import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions - Leo Charter Services",
  description: "Terms and Conditions for Leo Charter Services",
};

export default function TermsConditionsLayout({ children }: { children: React.ReactNode }) {
  return <section className="w-full">
  <div className="w-full max-w-3xl mx-auto pt-10">
    {children}
  </div>
  </section>;
}
