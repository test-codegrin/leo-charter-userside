"use client";

import { Suspense } from "react";
import { Progress } from "@heroui/react";
import ManualInvoiceOverview from "./ManualInvoiceOverview";

export default function ManualPaymentPage() {
  return (
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
      <ManualInvoiceOverview />
    </Suspense>
  );
}
