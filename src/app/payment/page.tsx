"use client";

import { Suspense } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentHandler from "./PaymentHandler";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      {/* ✅ Fix: wrap the client component using useSearchParams in Suspense */}
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-black text-white text-lg">
            Loading payment details...
          </div>
        }
      >
        <PaymentHandler />
      </Suspense>
    </Elements>
  );
}
