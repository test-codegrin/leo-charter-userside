"use client";

import { useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { authAPI } from "@/lib/api";

interface BookingPayload {
  fleets: number[];
  invoiceId?: number;
  tripId: number;
  quotedAmount: number;
  invoiceTitle: string;
  description: string;
  issueDate: string;
  dueDate: string;
  preferedVehicleType: string;
  quantity: number;
  gratuities: number;
  tax: number;
  totalAmount: number;
  send: boolean;
}

export default function ConfirmationPage() {
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

        // ✅ Decode the JWT payload
        const payload = jwtDecode<BookingPayload>(token);

        if (!payload.tripId) {
          setError("Invalid trip details.");
          setLoading(false);
          return;
        }

        // ✅ Send data to backend API
       await authAPI.confirmBooking(payload);

        // ✅ If successful
        setConfirmed(true);
      } catch (err) {
        console.error("Booking confirmation failed:", err);
        setError("Something went wrong while confirming your booking.");
      } finally {
        setLoading(false);
      }
    };

    confirmBooking();
  }, [searchParams]);

  // ✅ Loader / Confirming State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-zinc-400 text-sm">Confirming your booking...</p>
      </div>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 text-center">
        <Image
          src="/assets/leo.png"
          alt="Leo Charter Logo"
          width={250}
          height={100}
          className="object-contain mb-6"
        />
        <h2 className="text-lg font-semibold text-red-400 mb-2">Booking Failed</h2>
        <p className="text-zinc-400 mb-4">{error}</p>
        <Button color="primary" onPress={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  // ✅ Confirmation Success Screen
  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        {/* Logo */}
        <Image
          src="/assets/leo.png"
          alt="Leo Charter Logo"
          width={250}
          height={100}
          className="object-contain mb-10"
        />

        {/* Success Message */}
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

  return null;
}
