"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Button, Spinner } from "@heroui/react";
import { CreditCard, Download, ExternalLink } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface ManualPaymentToken {
  manualInvoiceId?: number;
  invoiceUrl?: string;
  invoiceLink?: string;
  payNowUrl?: string;
}

export default function ManualInvoiceOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<ManualPaymentToken | null>(null);
  const [liveInvoiceUrl, setLiveInvoiceUrl] = useState<string | null>(null);
  const [livePayNowUrl, setLivePayNowUrl] = useState<string | null>(null);
  const [previewDisabled, setPreviewDisabled] = useState(false);

  const [numPages, setNumPages] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
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

      Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/manual-invoice/${tokenData.manualInvoiceId}`).then(
          (r) => r.json()
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/check-manual-payment-status/${tokenData.manualInvoiceId}`
        ).then((r) => r.json()),
      ])
        .then(([invoiceResult, statusResult]) => {
          if (invoiceResult.status === "fulfilled") {
            const invoiceData = invoiceResult.value;
            const freshInvoiceUrl =
              invoiceData?.data?.invoiceLink ||
              invoiceData?.data?.invoiceUrl ||
              invoiceData?.invoiceLink ||
              invoiceData?.invoiceUrl ||
              null;
            const freshPayNowUrl = invoiceData?.data?.payNowUrl || invoiceData?.payNowUrl || null;

            if (freshInvoiceUrl) setLiveInvoiceUrl(freshInvoiceUrl);
            if (freshPayNowUrl) setLivePayNowUrl(freshPayNowUrl);
          }

          if (statusResult.status === "fulfilled") {
            const statusData = statusResult.value?.data || statusResult.value || {};
            const isPaid =
              Boolean(statusData?.isFullyPaid) ||
              String(statusData?.paymentStage || statusData?.paymentStatus || "").toLowerCase() === "paid" ||
              Number(statusData?.remainingAmount ?? 1) <= 0;
            setPreviewDisabled(isPaid);
          }
        })
        .finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to decode manual payment token:", err);
      setError("Invalid or expired invoice link");
      setLoading(false);
    }
  }, [searchParams]);

  const pdfUrl = useMemo(() => {
    const directPdf =
      searchParams.get("pdf") || searchParams.get("invoiceUrl") || searchParams.get("invoiceLink");

    return directPdf || liveInvoiceUrl || decoded?.invoiceUrl || decoded?.invoiceLink || null;
  }, [searchParams, decoded, liveInvoiceUrl]);

  const payNowUrl = useMemo(() => {
    return searchParams.get("payNowUrl") || livePayNowUrl || decoded?.payNowUrl || null;
  }, [searchParams, decoded, livePayNowUrl]);

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
    if (payNowUrl) {
      try {
        const parsedUrl = new URL(payNowUrl, window.location.origin);
        if (parsedUrl.pathname === "/payment/manual/pay") {
          parsedUrl.searchParams.set("fromPreview", "1");
        }
        window.location.assign(parsedUrl.toString());
      } catch {
        window.location.assign(payNowUrl);
      }
      return;
    }

    const nextParams = new URLSearchParams(redirectQueryString);
    nextParams.set("fromPreview", "1");
    const targetUrl = `/payment/manual/pay?${nextParams.toString()}`;

    router.push(targetUrl);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
        <Spinner color="primary" />
      </div>
    );
  }

  if (error || !decoded?.manualInvoiceId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0A0A] text-white text-center px-4">
        <p className="text-red-400">{error || "Invalid invoice link"}</p>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0A0A] text-white text-center px-4">
        <p className="text-red-400">PDF URL missing. Pass `pdf` (or `invoiceUrl`/`invoiceLink`).</p>
      </div>
    );
  }

  if (previewDisabled) {
    return (
      <div className="h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">Invoice Preview Disabled</h2>
          <p className="text-zinc-300">
            Payment is already completed for this invoice. You can continue on the payment page to view status or
            receipt.
          </p>
          <Button color="primary" onPress={handlePayRedirect}>
            Go to Payment Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col">
      <div className="flex-1 min-h-0 bg-[#0A0A0A] overflow-x-auto overflow-y-auto p-3 md:p-6">
        <div className="mx-auto min-w-[920px] w-fit flex flex-col items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
          <Document
            file={pdfUrl}
            loading={<Spinner color="primary" />}
            onLoadSuccess={({ numPages: loadedPages }) => {
              setNumPages(loadedPages);
              setPdfError(null);
            }}
            onLoadError={() => setPdfError("Unable to load PDF preview. You can still open or download the file.")}
            error={<p className="text-red-400 text-sm">{pdfError || "Unable to load PDF preview."}</p>}
            className="w-full flex justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              {Array.from(new Array(numPages), (_, index) => (
                <Page key={`page_${index + 1}`} pageNumber={index + 1} width={900} />
              ))}
            </div>
          </Document>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-800 bg-[#0A0A0A] flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="flat"
          className="bg-neutral-800 text-white hover:bg-neutral-700"
          startContent={<ExternalLink className="w-4 h-4" />}
          onPress={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}
        >
          Open PDF
        </Button>
        <Button
          variant="flat"
          className="bg-neutral-800 text-white hover:bg-neutral-700"
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
          Pay Now
        </Button>
      </div>
    </div>
  );
}
