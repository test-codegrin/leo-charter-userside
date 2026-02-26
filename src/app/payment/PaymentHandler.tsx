"use client";

import { useState, useEffect, useRef, FormEvent, useMemo } from "react";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { StripeCardNumberElement } from "@stripe/stripe-js";
import {
  Button,
  Input,
  Spinner,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Divider,
} from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { authAPI } from "@/lib/api";
import { motion } from "framer-motion";
import Image from "next/image";
import { AxiosError } from "axios";
import { CheckCircleIcon, FileText } from "lucide-react";
import { images } from "@/lib/assets";

interface DecodedData {
  invoiceId: number;
  email: string;
  userId: number;

  totalAmount?: number;
  invoiceTotal?: number;
  totalPaid?: number;
  remainingAmount?: number;
  paymentStage?: "deposit" | "remaining" | "full" | "paid" | "partial";
  isDepositStage?: boolean;
}

interface InvoiceData {
  invoiceId: number;
  tripId: number;
  invoiceLink: string | null;
  invoiceTitle: string;
  discount_per: number;
  admin_fees: number;
  deposit_per: number;
  issueDate: string;
  dueDate: string;
  updated_at: string;
  created_at: string;
}

interface Trip {
  tripId: number;
  externalTripId: string;
  userId: number;
  serviceOption: string;
  distance: string;
  travelTime: string;
  numberOfPassengers: number;
  totalBookings: string;
  noteToUs: string;
  functions: string;
  categoryId: number;
  quotationDescription: string;
  modifiedBy: string;
  isQuoteAccepted: number;
  flightNumber: string;
  test: number;
  user_view: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string | null;
  phoneNo: string | null;
  address: string | null;
  cityName: string | null;
  provinceName: string | null;
  postalCode: number | null;
  segmentId: number | null;
  company: string | null;
}

interface TripItinerary {
  itineraryId: number;
  tripId: number;
  type: string | null;
  order: number | null;
  pickUpAddress: string | null;
  dropOffAddress: string | null;
  pickUpDate: string | null;
  pickUpTime: string | null;
  returnDate: string | null;
  returnTime: string | null;
}

interface TripStops {
  stopId: number;
  tripId: number;
  itineraryId: number;
  stopName: string | null;
  stopOrder: number;
  address: string | null;
  time: string | null;
  date: string | null;
}

interface TripFleet {
  fleetId: number;
  tripId: number;
  vehicleClass: string;
  preferedVehicleType: string;
  quantity: string;
  amount: string;
  tax: string;
  gratuities: string;
  total: string;
  description: string | null;
  editId: number | null;
  updated_at: string;
}

interface TripData {
  trip: Trip;
  trip_itinerary: TripItinerary[];
  trip_stops: TripStops[];
  trip_fleet: TripFleet[];
}

interface CalculatedTotals {
  subtotal: number;
  taxAmount: number;
  gratuityAmount: number;
  adminFeesAmount: number;
  depositAmount: number;
  totalAmount: number;
  taxPercentage: number;
  gratuityPercentage: number;
  adminFeesPercentage: number;
  depositPercentage: number;
}

export default function PaymentHandler() {
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();

  const [iframeKey, setIframeKey] = useState(0);
  const [decoded, setDecoded] = useState<DecodedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [canPay, setCanPay] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cardReady, setCardReady] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [tripData, setTripData] = useState<TripData | null>(null);

  const [calculatedTotals, setCalculatedTotals] = useState<CalculatedTotals | null>(null);

  const [paymentStage, setPaymentStage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isDepositStage, setIsDepositStage] = useState(false);

  const [invoiceTotal, setInvoiceTotal] = useState<number | null>(null);
  const [totalPaid, setTotalPaid] = useState<number | null>(null);
  const [remainingAmount, setRemainingAmount] = useState<number | null>(null);

  const [amountDueNow, setAmountDueNow] = useState<number | null>(null);

  const [paymentToken, setPaymentToken] = useState<string | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const declineAudioRef = useRef<HTMLAudioElement | null>(null);
  const cardRef = useRef<StripeCardNumberElement | null>(null);

  const handleCardReady = () => setCardReady(true);

  const calculateTotals = (
    fleetData: TripFleet[],
    admin_fees: number,
    deposit_per: number
  ): CalculatedTotals => {
    let aggregatedSubtotal = 0;
    let aggregatedTaxAmount = 0;
    let aggregatedGratuityAmount = 0;
    let aggregatedAdminFeesAmount = 0;
    let aggregatedDepositAmount = 0;
    let aggregatedTotal = 0;

    if (fleetData.length > 0) {
      for (const fleetItem of fleetData) {
        const quantity = Number(fleetItem.quantity) || 0;
        const amount = Number(fleetItem.amount) || 0;
        const tax = Number(fleetItem.tax) || 0;
        const gratuities = Number(fleetItem.gratuities) || 0;

        const itemSubtotal = quantity * amount;
        const itemTaxAmount = itemSubtotal * (tax / 100);
        const itemGratuityAmount = itemSubtotal * (gratuities / 100);
        const itemAdminFeesAmount = itemSubtotal * (admin_fees / 100);

        const itemTotal =
          itemSubtotal + itemTaxAmount + itemGratuityAmount + itemAdminFeesAmount;

        const itemDepositAmount = itemTotal * (deposit_per / 100);

        aggregatedSubtotal += itemSubtotal;
        aggregatedTaxAmount += itemTaxAmount;
        aggregatedGratuityAmount += itemGratuityAmount;
        aggregatedAdminFeesAmount += itemAdminFeesAmount;
        aggregatedDepositAmount += itemDepositAmount;
        aggregatedTotal += itemTotal;
      }
    }

    const subtotal = aggregatedSubtotal;
    const taxAmount = aggregatedTaxAmount;
    const gratuityAmount = aggregatedGratuityAmount;
    const adminFeesAmount = aggregatedAdminFeesAmount;
    const depositAmount = aggregatedDepositAmount;
    const totalAmount = aggregatedTotal;

    const taxPercentage = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;
    const gratuityPercentage = subtotal > 0 ? (gratuityAmount / subtotal) * 100 : 0;
    const adminFeesPercentage = subtotal > 0 ? (adminFeesAmount / subtotal) * 100 : 0;
    const depositPercentage = totalAmount > 0 ? (depositAmount / totalAmount) * 100 : 0;

    return {
      subtotal,
      taxAmount,
      gratuityAmount,
      adminFeesAmount,
      depositAmount,
      totalAmount,
      taxPercentage,
      gratuityPercentage,
      adminFeesPercentage,
      depositPercentage,
    };
  };

  const parseNumberValue = (value: number | string | null | undefined): number | null => {
    if (value == null) return null;
    const parsed = typeof value === "string" ? Number(value) : value;
    return Number.isFinite(parsed) ? parsed : null;
  };

  const humanizeToken = (value: string | null | undefined, fallback = "") => {
    if (!value) return fallback;
    return value
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  // ✅ Decode JWT + fetch payment status
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
      const decodedData = jwtDecode<DecodedData>(token);
      setDecoded(decodedData);

      (async () => {
        try {
          const res = await authAPI.getPaymentStatus(decodedData.invoiceId);
          const statusData = res.data || {};

          const parsedAmountDue = parseNumberValue(statusData.totalAmount);
          const parsedRemaining = parseNumberValue(statusData.remainingAmount);
          const parsedPaid = parseNumberValue(statusData.totalPaid);
          const parsedInvoiceTotal = parseNumberValue(statusData.invoiceTotal);

          setIsFullyPaid(!!statusData.isFullyPaid);
          setCanPay(statusData.canPay ?? true);

          setAmountDueNow(parsedAmountDue);
          setRemainingAmount(parsedRemaining);
          setTotalPaid(parsedPaid);
          setInvoiceTotal(parsedInvoiceTotal);

          setPaymentStage(statusData.paymentStage ?? statusData.paymentStatus ?? null);
          setPaymentStatus(statusData.paymentStatus ?? null);
          setIsDepositStage(Boolean(statusData.isDepositStage));

          // ✅ THIS IS THE KEY: keep receiptUrl in state always
          setReceiptUrl(statusData.receiptUrl ?? null);
        } catch (err) {
          if ((err as AxiosError).response?.status === 404) {
            setIsFullyPaid(false);
            setCanPay(true);
            setAmountDueNow(null);
            setRemainingAmount(null);
            setTotalPaid(null);
            setInvoiceTotal(null);
            setPaymentStage(null);
            setPaymentStatus(null);
            setIsDepositStage(false);
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
  }, [searchParams, iframeKey]);

  // ✅ Fetch invoice (receipt display only)
  useEffect(() => {
    if (!decoded) return;

    (async () => {
      try {
        const res = await authAPI.getInvoice(decoded.invoiceId);
        setInvoiceData(res.data.invoice);
        setTripData(res.data.tripData);

        if (res.data.tripData?.trip_fleet && res.data.invoice) {
          const depositPerForUi = isDepositStage ? res.data.invoice.deposit_per : 0;

          const totals = calculateTotals(
            res.data.tripData.trip_fleet,
            res.data.invoice.admin_fees,
            depositPerForUi
          );
          setCalculatedTotals(totals);
        }
      } catch (err) {
        console.error("Failed to get invoice receipt:", err);
        setError("Failed to get invoice receipt");
      }
    })();
  }, [decoded, isDepositStage]);

  const stageKind = useMemo(() => {
    if (isDepositStage) return "deposit";
    if (paymentStage) return paymentStage.toLowerCase();
    if (paymentStatus) return paymentStatus.toLowerCase();
    return null;
  }, [isDepositStage, paymentStage, paymentStatus]);

  const stageTitle = useMemo(() => {
    if (stageKind === "deposit") return "Deposit due now";
    if (stageKind === "remaining" || stageKind === "partial") return "Remaining balance due now";
    if (stageKind === "full" || stageKind === "unpaid") return "Full payment due now";
    if (stageKind === "paid") return "Paid";
    return "Amount due now";
  }, [stageKind]);

  const stageDescription = useMemo(() => {
    if (stageKind === "deposit")
      return "The deposit secures your booking—remaining balance is listed below.";
    if (stageKind === "remaining" || stageKind === "partial")
      return "This payment covers your remaining balance after the deposit.";
    if (stageKind === "full" || stageKind === "unpaid")
      return "This payment covers the full invoice amount.";
    if (stageKind === "paid") return "This invoice is fully paid.";
    return "Pay the displayed amount to complete your booking.";
  }, [stageKind]);

  const uiAmountDueNow = useMemo(() => {
    if (amountDueNow != null) return amountDueNow;
    if (!calculatedTotals) return 0;
    return isDepositStage ? calculatedTotals.depositAmount : calculatedTotals.totalAmount;
  }, [amountDueNow, calculatedTotals, isDepositStage]);

  const uiRemainingBalance = useMemo(() => {
    if (remainingAmount != null) return remainingAmount;
    if (!calculatedTotals) return 0;
    const paid = totalPaid ?? 0;
    return Math.max(calculatedTotals.totalAmount - paid, 0);
  }, [remainingAmount, calculatedTotals, totalPaid]);

  const statusLabel = useMemo(() => {
    if (paymentStatus) return humanizeToken(paymentStatus, "Pending");
    if (isFullyPaid) return "Paid";
    if (canPay) return "Pending";
    return "Unavailable";
  }, [paymentStatus, isFullyPaid, canPay]);

  const handlePayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || !decoded) return;

    const card = cardRef.current;
    if (!card) {
      setErrorMsg("Card field is not ready yet. Please wait 2–3 seconds.");
      setErrorOpen(true);
      declineAudioRef.current?.play();
      return;
    }

    setProcessing(true);
    setErrorMsg("");

    try {
      if (!paymentToken) throw new Error("Missing payment token");

      const amount = Number(uiAmountDueNow);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid amount");
      }

      const res = await authAPI.createPaymentIntent({
        paymentToken,
        amount,
        currency: "cad",
        email: decoded.email,
        description: `Invoice #${decoded.invoiceId} ${stageTitle}`,
        invoiceId: decoded.invoiceId,
        paymentType: isDepositStage ? "deposit" : "full",
        isDepositStage,
        paymentStage: stageKind,
      });

      const clientSecret = res?.clientSecret || res?.data?.clientSecret;
      if (!clientSecret) throw new Error("Missing client secret from server");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { email: decoded.email },
        },
      });

      if (result.error) {
        setErrorMsg(result.error.message || "Payment declined");
        setErrorOpen(true);
        declineAudioRef.current?.play();
      } else if (result.paymentIntent?.status === "succeeded") {
        await authAPI.addPaymentDetails({
          invoiceId: decoded.invoiceId,
          clientSecret,
          paymentIntentId: result.paymentIntent.id,
          userId: decoded.userId,
          paymentType: isDepositStage ? "deposit" : "full",
        });

        setSuccessOpen(true);
        successAudioRef.current?.play();

        // ✅ refresh status (will fetch receiptUrl + remaining)
        setIframeKey((prev) => prev + 1);
      } else {
        setErrorMsg("Payment not completed. Please retry.");
        setErrorOpen(true);
        declineAudioRef.current?.play();
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMsg("Unexpected server error.");
      setErrorOpen(true);
      declineAudioRef.current?.play();
    } finally {
      setProcessing(false);
    }
  };

  const formatedDate = (date: string) => {
    if (!date) return "";
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatedTime = (time: string) => {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const hourNum = Number(hour);
    const period = hourNum >= 12 ? "PM" : "AM";
    const hour12 = hourNum % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minute} ${period}`;
  };

  // ✅ UI Loading States
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <Spinner color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:h-screen w-screen flex flex-col md:flex-row bg-[#0B0B0B] text-white overflow-hidden">
      {/* LEFT SIDE - Receipt */}
      <div className="relative flex-1 p-4 md:p-6 lg:p-10 flex items-center justify-center md:border-r border-neutral-800 overflow-y-auto overflow-x-hidden min-w-0">
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
        <div className="w-full md:w-5/6 lg:w-2/3 bg-palette-bg p-6 md:p-8 lg:p-10 rounded-3xl h-fit flex flex-col">
          <div className="space-y-2 text-xs md:text-sm flex-1 break-words">
            <h1 className="text-white text-xl font-semibold">Trip Summary</h1>
            <Divider className="my-4" />

            {tripData?.trip?.externalTripId && (
              <div className="flex">
                <span className="text-zinc-400">Trip Id:</span>
                <span className="text-white font-medium text-right break-all ml-2">
                  {tripData.trip.externalTripId}
                </span>
              </div>
            )}

            {tripData?.trip?.serviceOption && (
              <div className="flex">
                <span className="text-zinc-400">Service option:</span>
                <span className="text-white text-right ml-2">{tripData.trip.serviceOption}</span>
              </div>
            )}

            {tripData?.trip_itinerary?.[0]?.pickUpAddress && (
              <div className="flex">
                <span className="text-zinc-400">Pick up address:</span>
                <span className="text-white text-right ml-2">
                  {tripData.trip_itinerary[0].pickUpAddress}
                </span>
              </div>
            )}

            {tripData?.trip_itinerary?.[0]?.pickUpDate && (
              <div className="flex">
                <span className="text-zinc-400">Pick up date:</span>
                <span className="text-white text-right ml-2">
                  {formatedDate(tripData.trip_itinerary[0].pickUpDate)}
                </span>
              </div>
            )}

            {tripData?.trip_itinerary?.[0]?.pickUpTime && (
              <div className="flex">
                <span className="text-zinc-400">Pick up time:</span>
                <span className="text-white text-right ml-2">
                  {formatedTime(tripData.trip_itinerary[0].pickUpTime)}
                </span>
              </div>
            )}

            {tripData?.trip_itinerary?.[0]?.dropOffAddress && (
              <div className="flex">
                <span className="text-zinc-400">Drop off address:</span>
                <span className="text-white text-right ml-2">
                  {tripData.trip_itinerary[0].dropOffAddress}
                </span>
              </div>
            )}

            {tripData?.trip_itinerary?.[0]?.returnDate && (
              <div className="flex">
                <span className="text-zinc-400">Return date:</span>
                <span className="text-white text-right ml-2">
                  {formatedDate(tripData.trip_itinerary[0].returnDate)}
                </span>
              </div>
            )}

            {tripData?.trip_itinerary?.[0]?.returnTime && (
              <div className="flex">
                <span className="text-zinc-400">Return pick up time:</span>
                <span className="text-white text-right ml-2">
                  {formatedTime(tripData.trip_itinerary[0].returnTime)}
                </span>
              </div>
            )}

            {tripData?.trip?.distance && (
              <div className="flex">
                <span className="text-zinc-400">Distance:</span>
                <span className="text-white text-right ml-2">{tripData.trip.distance}</span>
              </div>
            )}

            {tripData?.trip?.travelTime && (
              <div className="flex">
                <span className="text-zinc-400">Travel Time:</span>
                <span className="text-white text-right ml-2">{tripData.trip.travelTime}</span>
              </div>
            )}

            {tripData?.trip?.functions && (
              <div className="flex">
                <span className="text-zinc-400">What function:</span>
                <span className="text-white text-right ml-2">{tripData.trip.functions}</span>
              </div>
            )}

            {tripData?.trip?.numberOfPassengers && tripData.trip.numberOfPassengers > 0 && (
              <div className="flex">
                <span className="text-zinc-400">No. of passengers:</span>
                <span className="text-white text-right ml-2">
                  {tripData.trip.numberOfPassengers}
                </span>
              </div>
            )}

            {tripData?.trip_fleet?.[0]?.vehicleClass && (
              <div className="flex">
                <span className="text-zinc-400">Vehicle Class:</span>
                <span className="text-white text-right ml-2">
                  {tripData.trip_fleet[0].vehicleClass}
                </span>
              </div>
            )}

            {tripData?.trip_fleet?.[0]?.preferedVehicleType && (
              <div className="flex">
                <span className="text-zinc-400">Preferred Vehicle Type:</span>
                <span className="text-white text-right text-xs ml-2">
                  {tripData.trip_fleet[0].preferedVehicleType}
                </span>
              </div>
            )}

            {tripData?.trip?.noteToUs && (
              <div className="flex">
                <span className="text-zinc-400">Note to us:</span>
                <span className="text-white text-right text-xs ml-2">
                  {tripData.trip.noteToUs}
                </span>
              </div>
            )}

            <Divider className="my-4 bg-neutral-700" />

            {calculatedTotals && (
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                      Payment Summary
                    </p>
                    <h2 className="text-lg font-semibold text-white">Amount details</h2>
                  </div>
                  <span className="text-xs text-zinc-400 text-right">Status: {statusLabel}</span>
                </div>

                <div className="bg-neutral-900/40 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm md:text-base font-bold">
                    <span className="text-white">Invoice Total:</span>
                    <span className="text-green-400">
                      {formatCurrency(invoiceTotal ?? calculatedTotals.totalAmount)}
                    </span>
                  </div>

                  {(totalPaid ?? 0) > 0 && (
                    <div className="flex justify-between pt-2 border-t border-white/10 text-sm text-zinc-400">
                      <span>Amount Paid:</span>
                      <span>{formatCurrency(totalPaid ?? 0)}</span>
                    </div>
                  )}

                  {(uiRemainingBalance ?? 0) > 0 && (
                    <div className="flex justify-between pt-2 border-t border-white/10 text-sm text-zinc-400">
                      <span>Remaining Balance:</span>
                      <span>{formatCurrency(uiRemainingBalance)}</span>
                    </div>
                  )}

                  {!isFullyPaid && canPay && (
                    <div className="flex justify-between pt-2 border-t border-white/10 text-sm text-zinc-200 font-semibold">
                      <span>{stageTitle}:</span>
                      <span>{formatCurrency(uiAmountDueNow)}</span>
                    </div>
                  )}

                  {/* ✅ Always show receipt button if available */}
                  {receiptUrl && (
                    <Button
                      variant="flat"
                      onPress={() => window.open(receiptUrl, "_blank")}
                      startContent={<FileText className="w-4 h-4" />}
                      className="w-full mt-3"
                    >
                      View Last Stripe Receipt
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Payment Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 md:px-6 lg:px-8 py-6 md:py-10 bg-[#0A0A0A] min-w-0">
        {isFullyPaid ? (
          <div className="text-center py-6 flex flex-col items-center justify-center text-green-400 font-semibold text-base md:text-lg gap-4 max-w-lg w-full">
            <CheckCircleIcon className="w-10 h-10 md:w-12 md:h-12" />
            Payment has already been completed for this invoice.
            {receiptUrl && (
              <Button
                variant="flat"
                onPress={() => window.open(receiptUrl, "_blank")}
                startContent={<FileText className="w-4 h-4" />}
                className="w-full"
              >
                View Last Stripe Receipt
              </Button>
            )}
          </div>
        ) : !canPay ? (
          <div className="text-center py-6 flex flex-col items-center justify-center text-zinc-400 font-semibold text-base md:text-lg gap-2">
            <p>Payment is not currently available for this invoice.</p>
            <p className="text-sm font-normal text-zinc-500">
              If you believe this is a mistake, please reach out to our support team.
            </p>
          </div>
        ) : (
          <div className="max-w-lg w-full space-y-4 md:space-y-6">
            <div className="text-center items-center justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Complete Your Payment
              </h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-zinc-400 text-xs md:text-sm">Secure transaction powered by</p>
                <Image
                  src={images.stripeLogo}
                  alt="Stripe"
                  width={40}
                  height={40}
                  className="md:w-[50px]"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">{stageDescription}</p>
            </div>

            {/* ✅ IMPORTANT: show receipt button ALSO on partial/remaining screen */}
            {receiptUrl && (
              <Button
                variant="flat"
                onPress={() => window.open(receiptUrl, "_blank")}
                startContent={<FileText className="w-4 h-4" />}
                className="w-full"
              >
                View Last Stripe Receipt
              </Button>
            )}

            <div className="space-y-3">
              <Input label="Email" value={decoded?.email || ""} isDisabled />
              <Input
                label={stageTitle}
                value={`CA$ ${Number(uiAmountDueNow || 0).toFixed(2)}`}
                isDisabled
              />
            </div>

            <Divider />

            <form onSubmit={handlePayment} className="space-y-4 md:space-y-6 mt-4">
              <div className="bg-neutral-800/70 rounded-lg p-3">
                <label className="text-xs md:text-sm text-zinc-400 mb-1 block">Card Number</label>
                <CardNumberElement
                  onReady={(el) => {
                    cardRef.current = el;
                    handleCardReady();
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
                isDisabled={!cardReady || processing || !uiAmountDueNow || uiAmountDueNow <= 0}
                className="w-full py-2 text-base md:text-lg font-semibold tracking-wide"
              >
                {processing ? (
                  <Spinner size="sm" color="white" />
                ) : cardReady ? (
                  `Pay ${formatCurrency(uiAmountDueNow)}`
                ) : (
                  "Loading Card..."
                )}
              </Button>

              <p className="text-xs text-center text-zinc-500 mt-2">
                Your payment information is securely encrypted.
              </p>
            </form>
          </div>
        )}
      </div>

      {/* ✅ Success Modal */}
      <Modal isOpen={successOpen} onOpenChange={setSuccessOpen} backdrop="blur">
        <ModalContent className="bg-neutral-900 text-white border border-neutral-800 rounded-xl p-6 text-center mx-4">
          <ModalHeader className="flex justify-center text-green-400 text-base md:text-lg font-semibold">
            Payment Successful
          </ModalHeader>
          <ModalBody>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Image
                src="/assets/payment-verified.gif"
                alt="Payment Verified"
                width={150}
                height={150}
                className="mx-auto mb-4 md:w-[180px] md:h-[180px]"
              />
            </motion.div>
            <p className="text-zinc-400 mb-3 text-sm md:text-base">
              Thank you! Your payment for invoice #{decoded?.invoiceId} is successful.
            </p>

            {/* ✅ Show receipt immediately after deposit/partial/full */}
            {receiptUrl && (
              <Button
                variant="flat"
                onPress={() => window.open(receiptUrl, "_blank")}
                startContent={<FileText className="w-4 h-4" />}
                className="w-full"
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

      {/* ❌ Declined Modal */}
      <Modal isOpen={errorOpen} onOpenChange={setErrorOpen} backdrop="blur">
        <ModalContent className="bg-neutral-900 text-white border border-neutral-800 rounded-xl p-6 text-center mx-4">
          <ModalHeader className="flex justify-center text-red-400 text-base md:text-lg font-semibold">
            Payment Declined
          </ModalHeader>
          <ModalBody>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Image
                src="/assets/payment-declined.gif"
                alt="Payment Declined"
                width={150}
                height={150}
                className="mx-auto mb-4 md:w-[180px] md:h-[180px]"
              />
            </motion.div>
            <p className="text-zinc-400 mb-2 text-sm md:text-base">{errorMsg}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={() => setErrorOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ✅ Sounds */}
      <audio ref={successAudioRef} src="/assets/payment-success.mp3" preload="auto" />
      <audio ref={declineAudioRef} src="/assets/payment-declined.mp3" preload="auto" />
    </div>
  );
}
