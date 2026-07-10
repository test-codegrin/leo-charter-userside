"use client";

import { Suspense, useEffect, useState } from "react";
import { Button, Progress, Spinner, addToast } from "@heroui/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { authAPI } from "@/lib/api";
import { BookingPayload } from "@/lib/types";
import { images } from "@/lib/assets";
import { routes } from "@/lib/routes";

// ✅ Child component that uses useSearchParams
function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingPayload, setBookingPayload] = useState<BookingPayload | null>(null);
  const [initializing, setInitializing] = useState(true);

  // ✅ Auto-confirm booking on page load
  useEffect(() => {
    const loadAndConfirmBooking = async () => {
      try {
        const token = searchParams.get("data");
        if (!token) {
          setError("Invalid booking link.");
          setInitializing(false);
          return;
        }

        const payload = jwtDecode<BookingPayload>(token);
        if (!payload.tripId) {
          setError("Invalid trip details.");
          setInitializing(false);
          return;
        }

        setBookingPayload(payload);
        setInitializing(false);
        
        // ✅ Automatically confirm booking
        setLoading(true);
        
        const res = await authAPI.confirmBooking(payload);

        if (res?.data?.success || res?.data?.message?.includes("email sent")) {
          setConfirmed(true);
          addToast({
            title: "Booking Confirmed!",
            description: "Your booking has been confirmed successfully.",
            color: "success",
          });
        } else {
          setError(res?.data?.message || "Booking confirmation failed.");
        }
      } catch (err) {
        console.error("Error confirming booking:", err);
        setError("Invalid booking link or confirmation failed.");
      } finally {
        setLoading(false);
      }
    };

    loadAndConfirmBooking();
  }, [searchParams]);

  // ✅ View booking handler with authentication check
  const handleViewBooking = () => {
    if (!bookingPayload?.tripId) {
      addToast({
        title: "Error",
        description: "Trip information not available.",
        color: "danger",
      });
      return;
    }

    const token = localStorage.getItem("token");
    const tripDetailsPath = `/trips/${bookingPayload.tripId}`;

    if (!token) {
      // ✅ Not logged in - redirect to login with return URL
      localStorage.setItem("redirectAfterLogin", tripDetailsPath);
      addToast({
        title: "Login Required",
        description: "Please login to view your booking.",
        color: "warning",
      });
      router.push(`${routes.login}?redirect=${encodeURIComponent(tripDetailsPath)}`);
      return;
    }

    // ✅ Already logged in - go directly to trip details
    router.push(tripDetailsPath);
  };

  // ✅ Loading State (initial or processing)
  if (initializing || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
        <Progress
          isIndeterminate 
          aria-label="Confirming booking..." 
          className="max-w-xs w-full" 
          size="sm"
          color="primary"
        />
        <p className="mt-4 text-zinc-400 text-sm text-center">
          {initializing ? "Loading booking information..." : "Confirming your booking..."}
        </p>
      </div>
    );
  }

  // ✅ Error State
  if (error && !confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 py-8 text-center">
        <Image
          src={images.logo}
          alt="Leo Charter Logo"
          width={200}
          height={80}
          className="object-contain mb-6 w-auto h-auto max-w-[200px]"
          unoptimized
          priority
        />
        <h2 className="text-lg md:text-xl font-semibold text-red-400 mb-2">
          Booking Failed
        </h2>
        <p className="text-zinc-400 text-sm md:text-base mb-4 max-w-md">{error}</p>
        <Button color="primary" onPress={() => window.close()} size="lg">
          Close Page
        </Button>
      </div>
    );
  }

  // ✅ Success State
  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 py-8">
        <Image
          src={images.logo}
          alt="Leo Charter Logo"
          width={200}
          height={80}
          className="object-contain mb-8 md:mb-10 w-auto h-auto max-w-[200px] md:max-w-[250px]"
          unoptimized
          priority
        />

        <div className="text-center space-y-3 md:space-y-4 max-w-2xl px-4">
          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-white">
            Thank you for confirming to proceed with your booking!
          </h1>

          <p className="text-zinc-400 text-sm md:text-base">
            Please note this is not the final confirmation.
          </p>

          <p className="text-zinc-400 text-sm md:text-base">
            We&apos;ll email you the invoice within 24 hours for easy online payment
            (credit/debit).
          </p>

          <p className="text-zinc-400 text-sm md:text-base">
            Once payment is received, you&apos;ll get a formal confirmation by email.
          </p>
          <p className="text-zinc-400 text-sm md:text-base">
            Your driver&apos;s name and contact will be shared 1-3 days before your
            service.
          </p>

          <div className="text-sm md:text-base text-zinc-400 mt-6 md:mt-8">
            <p>Best regards,</p>
            <p>Leo Charter Services</p>
          </div>

          <div className="flex flex-col sm:flex-row mt-6 md:mt-8 justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto">
            <Button 
              color="primary" 
              radius="sm" 
              onPress={handleViewBooking}
              size="lg"
              className="w-full sm:w-auto font-semibold"
            >
              View my booking
            </Button>
            <Button 
              color="primary" 
              variant="bordered" 
              radius="sm" 
              onPress={() => window.close()}
              size="lg"
              className="w-full sm:w-auto font-semibold"
            >
              Close the page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ✅ Wrapper with Suspense
export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-zinc-400 text-sm">Loading booking page...</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
