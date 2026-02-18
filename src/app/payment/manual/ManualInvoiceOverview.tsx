"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Button, Spinner } from "@heroui/react";
import { Download, ExternalLink } from "lucide-react";

interface ManualPaymentToken {
  manualInvoiceId?: number;
  invoiceUrl?: string;
  invoiceLink?: string;
}

export default function ManualInvoiceOverview() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<ManualPaymentToken | null>(null);

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
      setLoading(false);
    } catch (err) {
      console.error("Failed to decode manual payment token:", err);
      setError("Invalid or expired invoice link");
      setLoading(false);
    }
  }, [searchParams]);

  const pdfUrl = useMemo(() => {
    const directPdf =
      searchParams.get("pdf") || searchParams.get("invoiceUrl") || searchParams.get("invoiceLink");

    return directPdf || decoded?.invoiceUrl || decoded?.invoiceLink || null;
  }, [searchParams, decoded]);

  useEffect(() => {
    if (!loading && !error && pdfUrl) {
      window.location.replace(pdfUrl);
    }
  }, [loading, error, pdfUrl]);

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
    <div className="h-screen flex items-center justify-center bg-[#e9edf2] px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center max-w-md w-full">
        <h1 className="text-lg font-semibold text-slate-900">Opening Invoice PDF</h1>
        <p className="text-sm text-slate-600 mt-2">If it did not open automatically, use one of these actions.</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            color="primary"
            variant="solid"
            startContent={<ExternalLink className="w-4 h-4" />}
            onPress={() => window.location.replace(pdfUrl)}
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
        </div>
      </div>
    </div>
  );
}
