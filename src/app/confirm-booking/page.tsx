"use client";

import { Suspense, useEffect, useState } from "react";
import { Button, Progress, Spinner } from "@heroui/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { authAPI } from "@/lib/api";
import { BookingPayload } from "@/lib/types";

// ✅ Child component that uses useSearchParams
function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmBooking = async () => {
      try {
        const token = searchParams.get("data");
        if (!token) {
          setError("Invalid booking link.");
          setLoading(false);
          return;
        }

        const payload = jwtDecode<BookingPayload>(token);
        if (!payload.tripId) {
          setError("Invalid trip details.");
          setLoading(false);
          return;
        }

        // ✅ Send data to backend
        const res = await authAPI.confirmBooking(payload);

        if (res?.data?.success || res?.data?.message?.includes("email sent")) {
          setConfirmed(true);
        } else {
          setError(res?.data?.message || "Booking confirmation failed.");
        }
      } catch (err) {
        console.error("Booking confirmation failed:", err);
        setError("Something went wrong while confirming your booking.");
      } finally {
        setLoading(false);
      }
    };

    confirmBooking();
  }, [searchParams]);

  // ✅ Loader State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        <Progress
            isIndeterminate 
            aria-label="Loading..." 
            className="max-w-xs w-full " 
            size="sm"
            color="primary"
          />
      </div>
    );
  }

  // ✅ Error State
  if (error && !confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 text-center">
        <Image
          src="/assets/leo.png"
          alt="Leo Charter Logo"
          width={250}
          height={100}
          className="object-contain mb-6"
        />
        <h2 className="text-lg font-semibold text-red-400 mb-2">
          Booking Failed
        </h2>
        <p className="text-zinc-400 mb-4">{error}</p>
        <Button color="primary" onPress={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  // ✅ Success State
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
      <Image
        src="/assets/leo.png"
        alt="Leo Charter Logo"
        width={250}
        height={100}
        className="object-contain mb-10"
      />

      <div className="text-center space-y-4">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">
          Thank you for confirming to proceed with your booking!
        </h1>

        <p className="text-zinc-400 text-sm">
          Please note this is not the final confirmation.
        </p>

        <p className="text-zinc-400 text-sm leading-relaxed">
          We’ll email you the invoice within 24 hours for easy online payment
          (credit/debit/PayPal).
        </p>

        <p className="text-zinc-400 text-sm">
          Once payment is received, you’ll get a formal confirmation by email.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Your driver’s name and contact will be shared 1–3 days before your
          service.
        </p>

        <div className="pt-3 text-sm text-zinc-400">
          <p>Best regards,</p>
          <p className="font-medium text-white">Leo Charter Services</p>
        </div>
      </div>
    </div>
  );
}

// ✅ Wrapper with Suspense
export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-zinc-400 text-sm">Loading booking page...</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
