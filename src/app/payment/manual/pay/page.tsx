"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Progress } from "@heroui/react";
import ManualPaymentHandler from "./ManualPaymentHandler";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function ManualPaymentPayGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPreview = searchParams.get("fromPreview");

  useEffect(() => {
    if (fromPreview) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("fromPreview");
    const query = params.toString();
    router.replace(query ? `/payment/manual?${query}` : "/payment/manual");
  }, [fromPreview, router, searchParams]);

  if (!fromPreview) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white text-lg">
        <Progress
          isIndeterminate
          aria-label="Loading..."
          className="max-w-xs w-full"
          size="sm"
          color="primary"
        />
      </div>
    );
  }

  return <ManualPaymentHandler />;
}

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
        <ManualPaymentPayGate />
      </Suspense>
    </Elements>
  );
}
