"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { StripeCardNumberElement } from "@stripe/stripe-js";
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { AxiosError } from "axios";
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
import { ArrowLeft, CheckCircleIcon, FileText } from "lucide-react";
import { authAPI } from "@/lib/api";

interface ManualPaymentToken {
  invoiceId?: number;
  manualInvoiceId?: number;
  userId?: number;
  email?: string;
  totalAmount?: number | string;
  invoiceTotal?: number | string;
  totalPaid?: number | string;
  remainingAmount?: number | string;
  paymentStage?: "deposit" | "remaining" | "full" | "paid" | "partial" | "unpaid";
  isDepositStage?: boolean;
  subtotal?: number | string;
  gstAmount?: number | string;
  taxAmount?: number | string;
  gratuityAmount?: number | string;
  discountAmount?: number | string;
  depositAmount?: number | string;
}

const parseNumberValue = (value: number | string | null | undefined): number | null => {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "CAD" }).format(amount);

const readNumberFromSources = (
  searchParams: ReadonlyURLSearchParams,
  decoded: ManualPaymentToken | null,
  keys: string[]
): number | null => {
  for (const key of keys) {
    const raw = searchParams.get(key);
    if (raw != null) {
      const parsed = parseNumberValue(raw);
      if (parsed != null) return parsed;
    }
  }

  const decodedRecord = (decoded ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    const parsed = parseNumberValue(decodedRecord[key] as number | string | null | undefined);
    if (parsed != null) return parsed;
  }

  return null;
};

export default function ManualPaymentHandler() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();

  const [decoded, setDecoded] = useState<ManualPaymentToken | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cardReady, setCardReady] = useState(false);
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [canPay, setCanPay] = useState(true);
  const [paymentStage, setPaymentStage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isDepositStage, setIsDepositStage] = useState(false);

  const [amountDueNow, setAmountDueNow] = useState<number | null>(null);
  const [invoiceTotal, setInvoiceTotal] = useState<number | null>(null);
  const [totalPaid, setTotalPaid] = useState<number | null>(null);
  const [remainingAmount, setRemainingAmount] = useState<number | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const cardRef = useRef<StripeCardNumberElement | null>(null);

  const resolvedInvoiceId = useMemo(() => {
    if (!decoded) return null;
    return decoded.manualInvoiceId ?? decoded.invoiceId ?? null;
  }, [decoded]);

  const stageKind = useMemo(() => {
    if (isDepositStage) return "deposit";
    if (paymentStage) return paymentStage.toLowerCase();
    if (paymentStatus) return paymentStatus.toLowerCase();
    if (decoded?.paymentStage) return decoded.paymentStage.toLowerCase();
    return null;
  }, [isDepositStage, paymentStage, paymentStatus, decoded?.paymentStage]);

  const stageTitle = useMemo(() => {
    if (stageKind === "deposit") return "Deposit due now";
    if (stageKind === "remaining" || stageKind === "partial") return "Remaining balance due now";
    if (stageKind === "full" || stageKind === "unpaid") return "Full payment due now";
    if (stageKind === "paid") return "Paid";
    return "Amount due now";
  }, [stageKind]);

  const subtotal = useMemo(
    () => readNumberFromSources(searchParams, decoded, ["subtotal"]),
    [searchParams, decoded]
  );

  const taxAmount = useMemo(
    () => readNumberFromSources(searchParams, decoded, ["gstAmount", "taxAmount", "gst", "tax"]),
    [searchParams, decoded]
  );

  const gratuityAmount = useMemo(
    () => readNumberFromSources(searchParams, decoded, ["gratuityAmount"]),
    [searchParams, decoded]
  );

  const discountAmount = useMemo(
    () => readNumberFromSources(searchParams, decoded, ["discountAmount"]),
    [searchParams, decoded]
  );

  const depositAmount = useMemo(
    () => readNumberFromSources(searchParams, decoded, ["depositAmount"]),
    [searchParams, decoded]
  );

  useEffect(() => {
    const tokenParam = searchParams.get("data");
    if (!tokenParam) {
      setError("Invalid payment link");
      setLoading(false);
      return;
    }

    const token = decodeURIComponent(tokenParam);
    setPaymentToken(token);

    try {
      const decodedData = jwtDecode<ManualPaymentToken>(token);
      const linkedInvoiceId = parseNumberValue(decodedData.manualInvoiceId ?? decodedData.invoiceId);
      const isManualOnlyFlow = Boolean(decodedData.manualInvoiceId) && !decodedData.invoiceId;

      if (!linkedInvoiceId) {
        throw new Error("Missing invoice identifier in payment token");
      }

      const tokenAmountDue =
        readNumberFromSources(searchParams, decodedData, ["totalAmount"]) ??
        readNumberFromSources(searchParams, decodedData, ["remainingAmount"]);
      const tokenRemaining =
        readNumberFromSources(searchParams, decodedData, ["remainingAmount"]) ?? tokenAmountDue;
      const tokenPaid = readNumberFromSources(searchParams, decodedData, ["totalPaid"]);
      const tokenInvoiceTotal =
        readNumberFromSources(searchParams, decodedData, ["invoiceTotal"]) ??
        (tokenAmountDue ?? 0) + (tokenPaid ?? 0);

      const tokenStage = decodedData.paymentStage ?? null;
      const tokenIsDeposit = Boolean(decodedData.isDepositStage) || decodedData.paymentStage === "deposit";
      const tokenIsPaid =
        decodedData.paymentStage === "paid" ||
        (tokenRemaining != null && tokenRemaining <= 0) ||
        (tokenAmountDue != null && tokenAmountDue <= 0);

      setDecoded(decodedData);
      setAmountDueNow(tokenAmountDue);
      setRemainingAmount(tokenRemaining);
      setTotalPaid(tokenPaid);
      setInvoiceTotal(tokenInvoiceTotal);
      setPaymentStage(tokenStage);
      setPaymentStatus(null);
      setIsDepositStage(tokenIsDeposit);
      setIsFullyPaid(tokenIsPaid);
      setCanPay(!tokenIsPaid);

      if (isManualOnlyFlow) {
        (async () => {
          try {
            const res = await authAPI.getManualPaymentStatus(linkedInvoiceId);
            const statusData = res.data || {};

            const parsedAmountDue = parseNumberValue(statusData.totalAmount);
            const parsedRemaining = parseNumberValue(statusData.remainingAmount);
            const parsedPaid = parseNumberValue(statusData.totalPaid);
            const parsedInvoiceTotal = parseNumberValue(statusData.invoiceTotal);

            setIsFullyPaid(statusData.isFullyPaid ?? tokenIsPaid);
            setCanPay(statusData.canPay ?? !tokenIsPaid);
            setAmountDueNow(parsedAmountDue ?? tokenAmountDue);
            setRemainingAmount(parsedRemaining ?? tokenRemaining);
            setTotalPaid(parsedPaid ?? tokenPaid);
            setInvoiceTotal(parsedInvoiceTotal ?? tokenInvoiceTotal);
            setPaymentStage(statusData.paymentStage ?? statusData.paymentStatus ?? tokenStage);
            setPaymentStatus(statusData.paymentStatus ?? null);
            setIsDepositStage(statusData.isDepositStage ?? tokenIsDeposit);
            setReceiptUrl(statusData.receiptUrl ?? null);
          } catch (err) {
            if ((err as AxiosError).response?.status === 404) {
              setIsFullyPaid(tokenIsPaid);
              setCanPay(!tokenIsPaid);
              setAmountDueNow(tokenAmountDue);
              setRemainingAmount(tokenRemaining);
              setTotalPaid(tokenPaid);
              setInvoiceTotal(tokenInvoiceTotal);
              setPaymentStage(tokenStage);
              setPaymentStatus(null);
              setIsDepositStage(tokenIsDeposit);
              setReceiptUrl(null);
            } else {
              setError("Failed to check manual payment status");
            }
          } finally {
            setLoading(false);
          }
        })();
        return;
      }

      (async () => {
        try {
          const res = await authAPI.getPaymentStatus(linkedInvoiceId);
          const statusData = res.data || {};

          const parsedAmountDue = parseNumberValue(statusData.totalAmount);
          const parsedRemaining = parseNumberValue(statusData.remainingAmount);
          const parsedPaid = parseNumberValue(statusData.totalPaid);
          const parsedInvoiceTotal = parseNumberValue(statusData.invoiceTotal);

          setIsFullyPaid(statusData.isFullyPaid ?? tokenIsPaid);
          setCanPay(statusData.canPay ?? !tokenIsPaid);
          setAmountDueNow(parsedAmountDue ?? tokenAmountDue);
          setRemainingAmount(parsedRemaining ?? tokenRemaining);
          setTotalPaid(parsedPaid ?? tokenPaid);
          setInvoiceTotal(parsedInvoiceTotal ?? tokenInvoiceTotal);
          setPaymentStage(statusData.paymentStage ?? statusData.paymentStatus ?? tokenStage);
          setPaymentStatus(statusData.paymentStatus ?? null);
          setIsDepositStage(statusData.isDepositStage ?? tokenIsDeposit);
          setReceiptUrl(statusData.receiptUrl ?? null);
        } catch (err) {
          if ((err as AxiosError).response?.status === 404) {
            setIsFullyPaid(tokenIsPaid);
            setCanPay(!tokenIsPaid);
            setAmountDueNow(tokenAmountDue);
            setRemainingAmount(tokenRemaining);
            setTotalPaid(tokenPaid);
            setInvoiceTotal(tokenInvoiceTotal);
            setPaymentStage(tokenStage);
            setPaymentStatus(null);
            setIsDepositStage(tokenIsDeposit);
            setReceiptUrl(null);
          } else {
            setError("Failed to check payment status");
          }
        } finally {
          setLoading(false);
        }
      })();
    } catch (err) {
      console.error("JWT decode failed:", err);
      setError("Invalid or expired payment link");
      setLoading(false);
    }
  }, [searchParams]);

  const uiInvoiceTotal = useMemo(() => {
    if (invoiceTotal != null) return invoiceTotal;
    if (subtotal != null) {
      return subtotal + (taxAmount ?? 0) + (gratuityAmount ?? 0) - (discountAmount ?? 0);
    }
    return 0;
  }, [invoiceTotal, subtotal, taxAmount, gratuityAmount, discountAmount]);

  const uiTotalPaid = totalPaid ?? 0;

  const uiRemaining = useMemo(() => {
    if (remainingAmount != null) return remainingAmount;
    return Math.max(uiInvoiceTotal - uiTotalPaid, 0);
  }, [remainingAmount, uiInvoiceTotal, uiTotalPaid]);

  const uiAmountDueNow = useMemo(() => {
    if (amountDueNow != null) return amountDueNow;
    return uiRemaining;
  }, [amountDueNow, uiRemaining]);

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("fromPreview");
    const query = params.toString();
    return query ? `/payment/manual?${query}` : "/payment/manual";
  }, [searchParams]);

  const handlePayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || !decoded || !resolvedInvoiceId || !paymentToken) return;

    const card = cardRef.current;
    if (!card) {
      setErrorMsg("Card field is not ready yet. Please wait 2-3 seconds.");
      setErrorOpen(true);
      return;
    }

    setProcessing(true);
    setErrorMsg("");

    try {
      const amount = Number(uiAmountDueNow);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid amount");
      }

      const res = await authAPI.createManualPaymentIntent({
        paymentToken,
        amount,
        manualInvoiceId: decoded.manualInvoiceId ?? resolvedInvoiceId,
        currency: "cad",
        email: decoded.email,
        description: `Manual invoice #${resolvedInvoiceId} ${stageTitle}`,
        paymentType: isDepositStage ? "deposit" : "full",
        isDepositStage,
        paymentStage: stageKind ?? decoded.paymentStage ?? null,
      });

      const clientSecret = res?.clientSecret || res?.data?.clientSecret;
      if (!clientSecret) throw new Error("Missing client secret from server");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { email: decoded.email || "" },
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

        const stripeReceiptUrl =
          paymentIntentForReceipt.charges?.data?.[0]?.receipt_url ?? null;
        const latestChargeId = paymentIntentForReceipt.latest_charge ?? null;

        await authAPI.addManualPaymentDetails({
          manualInvoiceId: decoded.manualInvoiceId ?? resolvedInvoiceId,
          clientSecret,
          receiptUrl: stripeReceiptUrl ?? undefined,
          latestChargeId: latestChargeId ?? undefined,
          paymentIntentId: result.paymentIntent.id,
          userId: decoded.userId,
          paymentType: isDepositStage ? "deposit" : "full",
        });

        try {
          const statusRes = await authAPI.getManualPaymentStatus(
            decoded.manualInvoiceId ?? resolvedInvoiceId
          );
          const statusData = statusRes.data || {};

          const parsedAmountDue = parseNumberValue(statusData.totalAmount);
          const parsedRemaining = parseNumberValue(statusData.remainingAmount);
          const parsedPaid = parseNumberValue(statusData.totalPaid);
          const parsedInvoiceTotal = parseNumberValue(statusData.invoiceTotal);

          setIsFullyPaid(Boolean(statusData.isFullyPaid));
          setCanPay(statusData.canPay ?? !Boolean(statusData.isFullyPaid));
          setAmountDueNow(parsedAmountDue);
          setRemainingAmount(parsedRemaining);
          setTotalPaid(parsedPaid);
          setInvoiceTotal(parsedInvoiceTotal);
          setPaymentStage(statusData.paymentStage ?? statusData.paymentStatus ?? null);
          setPaymentStatus(statusData.paymentStatus ?? null);
          setIsDepositStage(Boolean(statusData.isDepositStage));
          setReceiptUrl(statusData.receiptUrl ?? stripeReceiptUrl ?? null);
        } catch (statusErr) {
          console.warn("Failed to refresh manual payment status after success:", statusErr);
          if (stripeReceiptUrl) {
            setReceiptUrl(stripeReceiptUrl);
          }
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
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto mb-4">
        <Button
          variant="flat"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push(previewUrl)}
          isDisabled={isFullyPaid}
          className="bg-neutral-800 text-white hover:bg-neutral-700"
        >
          Back to Preview
        </Button>
        {isFullyPaid && (
          <p className="text-xs text-zinc-500 mt-2">
            Preview is disabled because this invoice is fully paid.
          </p>
        )}
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 md:p-6 space-y-4 h-fit">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Manual Invoice</p>
            <h1 className="text-xl md:text-2xl font-semibold mt-1">#{resolvedInvoiceId}</h1>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-zinc-400">Customer Email</span>
              <span className="text-right break-all">{decoded?.email || "-"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-400">Status</span>
              <span>{isFullyPaid ? "Paid" : "Pending"}</span>
            </div>
          </div>

          <Divider className="bg-white/10" />

          <div className="space-y-2 text-sm">
            {subtotal != null && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            )}

            {taxAmount != null && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">GST / Tax</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}

            {gratuityAmount != null && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Gratuity</span>
                <span>{formatCurrency(gratuityAmount)}</span>
              </div>
            )}

            {discountAmount != null && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Discount</span>
                <span>- {formatCurrency(discountAmount)}</span>
              </div>
            )}

            {depositAmount != null && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Deposit</span>
                <span>{formatCurrency(depositAmount)}</span>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2 border-t border-white/10">
              <span className="text-zinc-400">Invoice Total</span>
              <span className="text-green-400 font-semibold">{formatCurrency(uiInvoiceTotal)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-400">Total Paid</span>
              <span>{formatCurrency(uiTotalPaid)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-400">Remaining</span>
              <span>{formatCurrency(uiRemaining)}</span>
            </div>
            <div className="flex justify-between gap-2 pt-2 border-t border-white/10 text-base font-semibold">
              <span>{stageTitle}</span>
              <span>{formatCurrency(uiAmountDueNow)}</span>
            </div>
          </div>

          {receiptUrl && (
            <Button
              variant="flat"
              className="w-full"
              startContent={<FileText className="w-4 h-4" />}
              onPress={() => window.open(receiptUrl, "_blank")}
            >
              View Last Stripe Receipt
            </Button>
          )}
        </div>

        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 md:p-6">
          {isFullyPaid ? (
            <div className="text-center py-8 flex flex-col items-center justify-center gap-4 text-green-400">
              <CheckCircleIcon className="w-12 h-12" />
              <p className="font-semibold">Payment has already been completed for this invoice.</p>
            </div>
          ) : !canPay ? (
            <div className="text-center py-8 text-zinc-400">
              Payment is not currently available for this invoice.
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Pay Manual Invoice</h2>
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
            <p className="text-zinc-300">Payment for manual invoice #{resolvedInvoiceId} was successful.</p>
            {receiptUrl && (
              <Button
                variant="flat"
                className="w-full mt-3"
                startContent={<FileText className="w-4 h-4" />}
                onPress={() => window.open(receiptUrl, "_blank")}
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
