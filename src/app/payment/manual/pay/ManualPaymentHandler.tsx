"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { StripeCardNumberElement } from "@stripe/stripe-js";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  Button,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import Image from "next/image";
import { ArrowLeft, CheckCircleIcon, FileText } from "lucide-react";
import { authAPI } from "@/lib/api";
import { images } from "@/lib/assets";

interface ManualPaymentToken {
  manualInvoiceId?: number;
  userId?: number;
  email?: string;
}

interface ManualPaymentStatusPayload {
  invoiceUrl?: string;
  invoiceLink?: string;
  invoiceTotal?: number | string;
  totalPaid?: number | string;
  remainingAmount?: number | string;
  totalAmount?: number | string;
  paymentStage?: string | null;
  paymentStatus?: string | null;
  isFullyPaid?: boolean;
  canPay?: boolean;
  isDepositStage?: boolean;
  receiptUrl?: string | null;
}

interface ManualPaymentStatus {
  invoiceUrl: string | null;
  invoiceTotal: number | null;
  totalPaid: number | null;
  remainingAmount: number | null;
  amountDueNow: number | null;
  paymentStage: string | null;
  paymentStatus: string | null;
  isFullyPaid: boolean;
  canPay: boolean;
  isDepositStage: boolean;
  receiptUrl: string | null;
}

const parseNumberValue = (value: number | string | null | undefined): number | null => {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "CAD" }).format(amount);

const extractStatusPayload = (rawData: unknown): ManualPaymentStatusPayload => {
  if (!rawData || typeof rawData !== "object") return {};
  const dataRecord = rawData as Record<string, unknown>;
  const nestedData = dataRecord.data;
  if (nestedData && typeof nestedData === "object") {
    return nestedData as ManualPaymentStatusPayload;
  }
  return dataRecord as ManualPaymentStatusPayload;
};

const normalizeStatus = (payload: ManualPaymentStatusPayload): ManualPaymentStatus => {
  const invoiceTotal = parseNumberValue(payload.invoiceTotal);
  const totalPaid = parseNumberValue(payload.totalPaid);
  const remainingAmount = parseNumberValue(payload.remainingAmount);
  const amountDueNow = parseNumberValue(payload.totalAmount) ?? remainingAmount;
  const paymentStage = typeof payload.paymentStage === "string" ? payload.paymentStage : null;
  const paymentStatus = typeof payload.paymentStatus === "string" ? payload.paymentStatus : null;

  const statusKind = (paymentStatus ?? paymentStage ?? "").toLowerCase();
  const inferredPaid = (remainingAmount != null && remainingAmount <= 0) || statusKind === "paid";
  const isFullyPaid = typeof payload.isFullyPaid === "boolean" ? payload.isFullyPaid : inferredPaid;
  const canPay = typeof payload.canPay === "boolean" ? payload.canPay : !isFullyPaid;
  const invoiceUrl =
    typeof payload.invoiceUrl === "string"
      ? payload.invoiceUrl
      : typeof payload.invoiceLink === "string"
        ? payload.invoiceLink
        : null;
  const receiptUrl = typeof payload.receiptUrl === "string" ? payload.receiptUrl : null;

  return {
    invoiceUrl,
    invoiceTotal,
    totalPaid,
    remainingAmount,
    amountDueNow,
    paymentStage,
    paymentStatus,
    isFullyPaid,
    canPay,
    isDepositStage: Boolean(payload.isDepositStage),
    receiptUrl,
  };
};

const EMPTY_STATUS: ManualPaymentStatus = {
  invoiceUrl: null,
  invoiceTotal: null,
  totalPaid: null,
  remainingAmount: null,
  amountDueNow: null,
  paymentStage: null,
  paymentStatus: null,
  isFullyPaid: false,
  canPay: true,
  isDepositStage: false,
  receiptUrl: null,
};

export default function ManualPaymentHandler() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();

  const [decoded, setDecoded] = useState<ManualPaymentToken | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ManualPaymentStatus>(EMPTY_STATUS);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cardReady, setCardReady] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const cardRef = useRef<StripeCardNumberElement | null>(null);

  const resolvedInvoiceId = useMemo(() => {
    if (!decoded) return null;
    return decoded.manualInvoiceId ?? null;
  }, [decoded]);

  const stageKind = useMemo(() => {
    const raw = status.paymentStage ?? status.paymentStatus;
    return raw ? raw.toLowerCase() : null;
  }, [status.paymentStage, status.paymentStatus]);

  const stageTitle = useMemo(() => {
    if (stageKind === "deposit") return "Deposit due now";
    if (stageKind === "remaining" || stageKind === "partial") return "Remaining balance due now";
    if (stageKind === "full" || stageKind === "unpaid") return "Full payment due now";
    if (stageKind === "paid") return "Paid";
    return "Amount due now";
  }, [stageKind]);

  const uiInvoiceTotal = useMemo(() => {
    if (status.invoiceTotal != null) return Math.max(status.invoiceTotal, 0);
    return Math.max((status.totalPaid ?? 0) + (status.remainingAmount ?? 0), 0);
  }, [status.invoiceTotal, status.totalPaid, status.remainingAmount]);

  const uiTotalPaid = useMemo(() => Math.max(status.totalPaid ?? 0, 0), [status.totalPaid]);

  const uiRemaining = useMemo(() => {
    if (status.remainingAmount != null) return Math.max(status.remainingAmount, 0);
    return Math.max(uiInvoiceTotal - uiTotalPaid, 0);
  }, [status.remainingAmount, uiInvoiceTotal, uiTotalPaid]);

  const uiAmountDueNow = useMemo(() => {
    if (status.amountDueNow != null) return Math.max(status.amountDueNow, 0);
    return uiRemaining;
  }, [status.amountDueNow, uiRemaining]);

  const showAmountDueNowRow = useMemo(() => {
    const isDuplicateRemainingStage = (stageKind === "remaining" || stageKind === "partial") && uiAmountDueNow === uiRemaining;
    return !isDuplicateRemainingStage;
  }, [stageKind, uiAmountDueNow, uiRemaining]);

  const cameFromPreview = useMemo(() => searchParams.get("fromPreview") === "1", [searchParams]);

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("fromPreview");
    const query = params.toString();
    return query ? `/payment/manual?${query}` : "/payment/manual";
  }, [searchParams]);

  useEffect(() => {
    if (!cameFromPreview) {
      router.replace(previewUrl);
    }
  }, [cameFromPreview, previewUrl, router]);

  const fetchLatestStatus = useCallback(
    async (manualInvoiceId: number, options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);

      if (!silent) {
        setLoading(true);
      }

      try {
        const res = await authAPI.getManualPaymentStatus(manualInvoiceId);
        const payload = extractStatusPayload(res.data);
        setStatus(normalizeStatus(payload));
        setError(null);
      } catch (statusErr) {
        console.error("Failed to fetch latest manual payment status:", statusErr);
        if (!silent) {
          setError("Failed to check manual payment status");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!cameFromPreview) {
      return;
    }

    const tokenParam = searchParams.get("data");
    if (!tokenParam) {
      setError("Invalid payment link");
      setLoading(false);
      return;
    }

    const token = decodeURIComponent(tokenParam);
    setPaymentToken(token);

    try {
      // Decode on client only for invoice lookup identity.
      const tokenData = jwtDecode<ManualPaymentToken>(token);
      const linkedInvoiceId = parseNumberValue(tokenData.manualInvoiceId);

      if (!linkedInvoiceId) {
        throw new Error("Missing manualInvoiceId in token");
      }

      setDecoded({
        manualInvoiceId: linkedInvoiceId,
        userId: tokenData.userId,
        email: tokenData.email,
      });

      void fetchLatestStatus(linkedInvoiceId);
    } catch (decodeErr) {
      console.error("JWT decode failed:", decodeErr);
      setError("Invalid or expired payment link");
      setLoading(false);
    }
  }, [cameFromPreview, fetchLatestStatus, searchParams]);

  useEffect(() => {
    if (!resolvedInvoiceId) return;

    const onWindowFocus = () => {
      void fetchLatestStatus(resolvedInvoiceId, { silent: true });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchLatestStatus(resolvedInvoiceId, { silent: true });
      }
    };

    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchLatestStatus, resolvedInvoiceId]);

  const handlePayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || !resolvedInvoiceId || !paymentToken) return;

    const card = cardRef.current;
    if (!card) {
      setErrorMsg("Card field is not ready yet. Please wait 2-3 seconds.");
      setErrorOpen(true);
      return;
    }

    if (uiAmountDueNow <= 0) {
      setErrorMsg("No payable amount remaining for this invoice.");
      setErrorOpen(true);
      return;
    }

    setProcessing(true);
    setErrorMsg("");

    try {
      const res = await authAPI.createManualPaymentIntent({
        paymentToken,
        manualInvoiceId: resolvedInvoiceId,
        currency: "cad",
        email: decoded?.email,
        description: `Manual invoice #${resolvedInvoiceId}`,
      });

      const clientSecret = res?.clientSecret || res?.data?.clientSecret;
      if (!clientSecret) throw new Error("Missing client secret from server");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { email: decoded?.email || "" },
        },
      });

      if (result.error) {
        setErrorMsg(result.error.message || "Payment declined");
        setErrorOpen(true);
      } else if (result.paymentIntent?.status === "succeeded") {
        const paymentIntentForReceipt = result.paymentIntent as unknown as {
          latest_charge?: string | null;
          charges?: { data?: Array<{ receipt_url?: string | null }> };
        };

        const stripeReceiptUrl = paymentIntentForReceipt.charges?.data?.[0]?.receipt_url ?? null;
        const latestChargeId = paymentIntentForReceipt.latest_charge ?? null;

        await authAPI.addManualPaymentDetails({
          manualInvoiceId: resolvedInvoiceId,
          clientSecret,
          receiptUrl: stripeReceiptUrl ?? undefined,
          latestChargeId: latestChargeId ?? undefined,
          paymentIntentId: result.paymentIntent.id,
          userId: decoded?.userId,
          paymentType: status.isDepositStage ? "deposit" : "full",
        });

        await fetchLatestStatus(resolvedInvoiceId, { silent: true });
        if (stripeReceiptUrl) {
          setStatus((previous) =>
            previous.receiptUrl ? previous : { ...previous, receiptUrl: stripeReceiptUrl }
          );
        }
        setSuccessOpen(true);
      } else {
        setErrorMsg("Payment not completed. Please retry.");
        setErrorOpen(true);
      }
    } catch (err) {
      console.error("Manual payment error:", err);
      setErrorMsg("Unexpected server error.");
      setErrorOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
        <Spinner color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0A0A] text-white text-center px-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8 pt-16 md:pt-20 lg:pt-24">
      <div className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8 z-10">
        <Image
          src={images.logo}
          alt="Leo Charter"
          width={200}
          height={58}
          className="h-auto w-[145px] md:w-[175px] lg:w-[200px]"
          priority
        />
      </div>

      <div className="max-w-6xl mx-auto mb-4">
        <Button
          variant="flat"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push(previewUrl)}
          isDisabled={status.isFullyPaid}
          className="bg-neutral-800 text-white hover:bg-neutral-700"
        >
          Back to Invoice
        </Button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div>
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 md:p-6 space-y-4 h-fit">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Invoice</p>
              <h1 className="text-xl md:text-2xl font-semibold mt-1">#{resolvedInvoiceId}</h1>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Customer Email</span>
                <span className="text-right break-all">{decoded?.email || "-"}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2 pt-2 border-t border-white/10">
                <span className="text-zinc-400">Invoice Total</span>
                <span className="text-green-400 font-semibold">{formatCurrency(uiInvoiceTotal)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Total Paid</span>
                <span>{formatCurrency(uiTotalPaid)}</span>
              </div>
              <div
                className={`flex justify-between gap-2 ${
                  !showAmountDueNowRow ? "pt-2 border-t border-white/10 text-base font-semibold" : ""
                }`}
              >
                <span className={!showAmountDueNowRow ? "text-white" : "text-zinc-400"}>Remaining</span>
                <span>{formatCurrency(uiRemaining)}</span>
              </div>
              {showAmountDueNowRow && (
                <div className="flex justify-between gap-2 pt-2 border-t border-white/10 text-base font-semibold">
                  <span>{stageTitle}</span>
                  <span>{formatCurrency(uiAmountDueNow)}</span>
                </div>
              )}
            </div>

            {status.receiptUrl && (
              <Button
                variant="flat"
                className="w-full"
                startContent={<FileText className="w-4 h-4" />}
                onPress={() => status.receiptUrl && window.open(status.receiptUrl, "_blank")}
              >
                View Last Stripe Receipt
              </Button>
            )}
          </div>
        </div>

        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 md:p-6">
          {status.isFullyPaid ? (
            <div className="text-center py-8 flex flex-col items-center justify-center gap-4 text-green-400">
              <CheckCircleIcon className="w-12 h-12" />
              <p className="font-semibold">Payment has already been completed for this invoice.</p>
            </div>
          ) : !status.canPay ? (
            <div className="text-center py-8 text-zinc-400">
              Payment is not currently available for this invoice.
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Pay Invoice</h2>
                <p className="text-zinc-400 text-sm mt-1">Secure transaction powered by Stripe</p>
              </div>

              <div className="space-y-3 mb-4">
                <Input label="Email" value={decoded?.email || ""} isDisabled />
                <Input label={stageTitle} value={`CA$ ${Number(uiAmountDueNow || 0).toFixed(2)}`} isDisabled />
              </div>

              <Divider className="my-4" />

              <form onSubmit={handlePayment} className="space-y-4">
                <div className="bg-neutral-800/70 rounded-lg p-3">
                  <label className="text-xs md:text-sm text-zinc-400 mb-1 block">Card Number</label>
                  <CardNumberElement
                    onReady={(el) => {
                      cardRef.current = el;
                      setCardReady(true);
                    }}
                    options={{
                      showIcon: true,
                      style: {
                        base: {
                          color: "#fff",
                          fontSize: "14px",
                          iconColor: "#ffffff",
                          "::placeholder": { color: "#9ca3af" },
                        },
                        invalid: { color: "#ff6b6b" },
                      },
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-800/70 rounded-lg p-3">
                    <label className="text-xs text-zinc-400 mb-1 block">Expiry</label>
                    <CardExpiryElement
                      options={{
                        style: {
                          base: { color: "#fff", fontSize: "13px" },
                          invalid: { color: "#ff6b6b" },
                        },
                      }}
                    />
                  </div>
                  <div className="bg-neutral-800/70 rounded-lg p-3">
                    <label className="text-xs text-zinc-400 mb-1 block">CVC</label>
                    <CardCvcElement
                      options={{
                        style: {
                          base: { color: "#fff", fontSize: "13px" },
                          invalid: { color: "#ff6b6b" },
                        },
                      }}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  color="primary"
                  isDisabled={!cardReady || processing || uiAmountDueNow <= 0}
                  className="w-full py-2 text-base md:text-lg font-semibold tracking-wide"
                >
                  {processing ? <Spinner size="sm" color="white" /> : `Pay ${formatCurrency(uiAmountDueNow)}`}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={successOpen} onOpenChange={setSuccessOpen} backdrop="blur">
        <ModalContent className="bg-neutral-900 text-white border border-neutral-800 rounded-xl p-6 text-center mx-4">
          <ModalHeader className="flex justify-center text-green-400 text-base md:text-lg font-semibold">
            Payment Successful
          </ModalHeader>
          <ModalBody>
            <p className="text-zinc-300">Payment for invoice #{resolvedInvoiceId} was successful.</p>
            {status.receiptUrl && (
              <Button
                variant="flat"
                className="w-full mt-3"
                startContent={<FileText className="w-4 h-4" />}
                onPress={() => status.receiptUrl && window.open(status.receiptUrl, "_blank")}
              >
                View Stripe Receipt
              </Button>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="success" variant="flat" onPress={() => setSuccessOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={errorOpen} onOpenChange={setErrorOpen} backdrop="blur">
        <ModalContent className="bg-neutral-900 text-white border border-neutral-800 rounded-xl p-6 text-center mx-4">
          <ModalHeader className="flex justify-center text-red-400 text-base md:text-lg font-semibold">
            Payment Failed
          </ModalHeader>
          <ModalBody>
            <p className="text-zinc-300">{errorMsg}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={() => setErrorOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
