"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { loadStripe, StripeCardNumberElement } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
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
import { CheckCircleIcon } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface DecodedData {
  invoiceId: number;
  invoiceLink: string;
  email: string;
  userId: number;
  totalAmount: number;
}

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentHandler />
    </Elements>
  );
}

function PaymentHandler() {
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();

  const [decoded, setDecoded] = useState<DecodedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const declineAudioRef = useRef<HTMLAudioElement | null>(null);

  const cardRef = useRef<StripeCardNumberElement | null>(null);

  // ✅ Track when Stripe iframe is fully mounted
  const handleCardReady = () => {
    setCardReady(true);
  };

  // ✅ Decode token & check payment status
  useEffect(() => {
    const tokenParam = searchParams.get("data");
    if (!tokenParam) {
      setError("Invalid payment link");
      setLoading(false);
      return;
    }

    const token = decodeURIComponent(tokenParam);
    try {
      const decodedData = jwtDecode<DecodedData>(token);
      setDecoded(decodedData);

      (async () => {
        try {
          const res = await authAPI.getPaymentStatus(decodedData.invoiceId);
          if (res.status === 200) setPaymentDone(true);
        } catch (err) {
          if ((err as AxiosError).response?.status === 404) setPaymentDone(false);
          else setError("Failed to check payment status");
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

  // ✅ Handle Payment
  const handlePayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || !decoded) return;

    const card = cardRef.current;
    if (!card) {
      setErrorMsg("Card field is not mounted. Please wait 2–3 seconds and retry.");
      setErrorOpen(true);
      declineAudioRef.current?.play();
      return;
    }

    setProcessing(true);
    setErrorMsg("");

    try {
      const res = await authAPI.createPaymentIntent({
        amount: decoded.totalAmount,
        currency: "cad",
        email: decoded.email,
        description: `Invoice #${decoded.invoiceId} Payment`,
      });

      const clientSecret = res?.clientSecret || res?.data?.clientSecret;
      if (!clientSecret) throw new Error("Missing client secret from server");

      // ✅ Confirm payment only after element is stable
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { email: decoded.email },
        },
      });

      if (result.error) {
        const reason = result.error.message || "Payment declined";
        setErrorMsg(reason);
        setErrorOpen(true);
        declineAudioRef.current?.play();
      } else if (result.paymentIntent?.status === "succeeded") {
        await authAPI.addPaymentDetails({
          invoiceId: decoded.invoiceId,
          clientSecret,
          paymentIntentId: result.paymentIntent.id,
          userId: decoded.userId,
        });
        setSuccessOpen(true);
        successAudioRef.current?.play();
        setPaymentDone(true);
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
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#0B0B0B] text-white overflow-hidden">
      {/* LEFT - PDF PREVIEW */}
      <div className="flex-1 p-6 flex flex-col border-r border-neutral-800">
        <h2 className="text-2xl font-semibold text-center mb-4 text-zinc-200">
          Invoice #{decoded?.invoiceId}
        </h2>
        <iframe
          src={decoded?.invoiceLink}
          className="flex-1 rounded-lg border border-neutral-800 shadow-inner"
        />
      </div>

      {/* RIGHT - PAYMENT */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-10">
        {paymentDone?(
          <div className="text-center py-6 flex flex-col items-center justify-center text-green-400 font-semibold text-lg gap-4">
            <CheckCircleIcon className="w-12 h-12 " />
            Payment has already been completed for this trip.
            </div>):(
            <div className="max-w-lg w-full space-y-6">
          <div className="text-center items-center justify-center">
            <h2 className="text-3xl font-bold text-white mb-2">Complete Your Payment</h2>
            <div className="flex items-center justify-center gap-2">
              <p className="text-zinc-400 text-sm">
              Secure transaction powered by 
            </p>
            <Image src="/assets/stripe.png" alt="Stripe" width={50} height={50} />
            </div>
          </div>

          <div className="space-y-3">
            <Input label="Email" value={decoded?.email || ""} isDisabled />
            <Input label="Total Amount (CAD)" value={`CA$ ${decoded?.totalAmount}`} isDisabled />
          </div>
          <Divider />
          <form onSubmit={handlePayment} className="space-y-6 mt-4">
              <div className="bg-neutral-800/70 rounded-lg p-3">
                <label className="text-sm text-zinc-400 mb-1 block">Card Number</label>
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
                        fontSize: "16px",
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
                        base: { color: "#fff", fontSize: "14px" },
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
                        base: { color: "#fff", fontSize: "14px" },
                        invalid: { color: "#ff6b6b" },
                      },
                    }}
                  />
                </div>
              </div>

              <Button
                type="submit"
                color="primary"
                isDisabled={!cardReady || processing}
                className="w-full py-2 text-lg font-semibold tracking-wide"
              >
                {processing ? <Spinner size="sm" /> : cardReady ? "Pay Now" : "Loading Card..."}
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
        <ModalContent className="bg-neutral-900 text-white border border-neutral-800 rounded-xl p-6 text-center">
          <ModalHeader className="flex justify-center text-green-400 text-lg font-semibold">
            Payment Successful
          </ModalHeader>
          <ModalBody>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Image
                src="/assets/payment-verified.gif"
                alt="Payment Verified"
                width={180}
                height={180}
                className="mx-auto mb-4"
              />
            </motion.div>
            <p className="text-zinc-400 mb-2">
              Thank you! Your payment for invoice #{decoded?.invoiceId} is complete.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="success" variant="flat" onPress={() => setSuccessOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ❌ Decline Modal */}
      <Modal isOpen={errorOpen} onOpenChange={setErrorOpen} backdrop="blur">
        <ModalContent className="bg-neutral-900 text-white border border-neutral-800 rounded-xl p-6 text-center">
          <ModalHeader className="flex justify-center text-red-400 text-lg font-semibold">
            Payment Declined
          </ModalHeader>
          <ModalBody>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Image
                src="/assets/payment-declined.gif"
                alt="Payment Declined"
                width={180}
                height={180}
                className="mx-auto mb-4"
              />
            </motion.div>
            <p className="text-zinc-400 mb-2">{errorMsg}</p>
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
