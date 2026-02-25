"use client";

import { Suspense } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Progress } from "@heroui/react";
import ManualPaymentHandler from "./ManualPaymentHandler";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ManualPaymentCheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-black text-white text-lg">
            <Progress
              isIndeterminate
              aria-label="Loading..."
              className="max-w-xs w-full"
              size="sm"
              color="primary"
            />
          </div>
        }
      >
        <ManualPaymentHandler />
      </Suspense>
    </Elements>
  );
}
