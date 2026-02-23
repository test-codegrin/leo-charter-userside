"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Button, Spinner } from "@heroui/react";
import { CreditCard, Download, ExternalLink } from "lucide-react";


interface ManualPaymentToken {
  manualInvoiceId?: number;
  invoiceUrl?: string;
  invoiceLink?: string;
}

export default function ManualInvoiceOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<ManualPaymentToken | null>(null);
  const [liveInvoiceUrl, setLiveInvoiceUrl] = useState<string | null>(null); // ✅ NEW

  useEffect(() => {
    const tokenParam = searchParams.get("data");
    if (!tokenParam) {
      setError("Invalid invoice link");
      setLoading(false);
      return;
    }

    try {
      const token = decodeURIComponent(tokenParam);
      const tokenData = jwtDecode<ManualPaymentToken>(token);

      if (!tokenData.manualInvoiceId) {
        throw new Error("manualInvoiceId missing in token");
      }

      setDecoded(tokenData);

      // ✅ NEW: fetch fresh PDF URL from backend
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/manual-invoice/${tokenData.manualInvoiceId}`)
        .then(r => r.json())
        .then(data => {
          const freshUrl = data?.data?.invoiceLink || data?.invoiceLink || null;
          if (freshUrl) setLiveInvoiceUrl(freshUrl);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

    } catch (err) {
      console.error("Failed to decode manual payment token:", err);
      setError("Invalid or expired invoice link");
      setLoading(false);
    }
  }, [searchParams]);

  // ✅ UPDATED: liveInvoiceUrl takes priority over stale token URL
  const pdfUrl = useMemo(() => {
    if (liveInvoiceUrl) return liveInvoiceUrl;

    const directPdf =
      searchParams.get("pdf") || searchParams.get("invoiceUrl") || searchParams.get("invoiceLink");

    return directPdf || decoded?.invoiceUrl || decoded?.invoiceLink || null;
  }, [searchParams, decoded, liveInvoiceUrl]);

  const redirectQueryString = useMemo(() => searchParams.toString(), [searchParams]);

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `manual-invoice-${decoded?.manualInvoiceId ?? "file"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePayRedirect = () => {
    const targetUrl = redirectQueryString
      ? `/payment/manual/pay?${redirectQueryString}`
      : "/payment/manual/pay";
    router.push(targetUrl);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#e9edf2] text-slate-900">
        <Spinner color="primary" />
      </div>
    );
  }

  if (error || !decoded?.manualInvoiceId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#e9edf2] text-slate-900 text-center px-4">
        <p className="text-red-500">{error || "Invalid invoice link"}</p>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#e9edf2] text-slate-900 text-center px-4">
        <p className="text-red-500">PDF URL missing. Pass `pdf` (or `invoiceUrl`/`invoiceLink`).</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#e9edf2] flex flex-col">
      <div className="flex-1 min-h-0 bg-white">
        <iframe title="Manual Invoice PDF" src={pdfUrl} className="w-full h-full border-0" />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-center gap-2">
        <Button
          color="primary"
          variant="flat"
          startContent={<ExternalLink className="w-4 h-4" />}
          onPress={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}
        >
          Open PDF
        </Button>
        <Button
          color="primary"
          variant="flat"
          startContent={<Download className="w-4 h-4" />}
          onPress={handleDownloadPdf}
        >
          Download
        </Button>
        <Button
          color="primary"
          variant="solid"
          startContent={<CreditCard className="w-4 h-4" />}
          onPress={handlePayRedirect}
        >
          Pay
        </Button>
      </div>
    </div>
  );
}