"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, addToast, InputOtp, Progress } from "@heroui/react";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { AxiosError } from "axios";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function VerifyOtp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  // 🕒 Load saved data and start timer
  useEffect(() => {
    const savedEmail = localStorage.getItem("pendingEmail");
    const savedToken = localStorage.getItem("otpToken");

    if (!savedEmail || !savedToken) {
      addToast({
        title: "Session Expired",
        description: "Please sign in again to request a new OTP.",
        color: "danger",
      });
      router.replace(routes.login);
      return;
    }

    setEmail(savedEmail);
    setToken(savedToken);
    setTimer(30);

    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(countdown);
  }, [router]);

  // ✅ Verify OTP
  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp.trim()) {
      addToast({
        title: "Missing OTP",
        description: "Please enter the 6-digit OTP sent to your email.",
        color: "danger",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.verifyOtp(email, otp, token);

      if (res.data.success) {
        // ✅ Store user and permanent token
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.removeItem("pendingEmail");
        localStorage.removeItem("otpToken");

        // ✅ Redirect after 1 second
        setTimeout(() => {
          router.replace(routes.trips);
        }, 1000);
      } else {
        setLoading(false);
        addToast({
          title: "Invalid OTP",
          description: "Please enter the correct OTP or request a new one.",
          color: "danger",
        });
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error(err);
      setLoading(false);
      addToast({
        title: "Verification Failed",
        description: err.response?.data?.message || "OTP invalid or expired.",
        color: "danger",
      });
    }
  };

  // 🔁 Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) return;
    try {
      setResendLoading(true);
      const res = await authAPI.sendOtp(email);

      localStorage.setItem("otpToken", res.data.token);
      setToken(res.data.token);

      addToast({
        title: "OTP Resent",
        description: `A new OTP has been sent to ${email}`,
        color: "success",
      });

      setTimer(30);
      const countdown = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      setTimeout(() => clearInterval(countdown), 30000);
    } catch (err) {
      console.error(err);
      addToast({
        title: "Resend Failed !",
        description: "Unable to resend OTP. Please try again.",
        color: "danger",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // ✅ Handle back button
  const handleBack = () => {
    localStorage.removeItem("pendingEmail");
    localStorage.removeItem("otpToken");
    router.replace(routes.login);
  };

  // ✅ Fullscreen loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        
          <Progress 
            isIndeterminate 
            aria-label="Loading..." 
            className="max-w-xs w-full " 
            size="sm"
            color="primary"
          />
      
      </div>
    );
  }

  return (
    <div className="flex font-sans min-h-screen items-center justify-center dark:bg-neutral-900">
      <Card className="w-full max-w-[350px] md:max-w-[400px] mx-4 bg-black text-white rounded-3xl shadow-2xl">
        <CardBody className="flex flex-col gap-6 p-6 sm:p-8 items-center justify-center">
          <form
            onSubmit={handleVerify}
            className="flex flex-col gap-6 w-full items-center"
          >
            <h1 className="font-barlow text-2xl sm:text-3xl font-semibold text-center text-white tracking-tight">
              Verify OTP
            </h1>

            <p className="text-center text-xs sm:text-sm text-zinc-400">
              We&apos;ve emailed a 6-digit confirmation code <br /> 
              at <span className="underline underline-offset-4">{email}</span>. Please enter <br />
              the code in below box to verify your email.
            </p>

            <div className="flex justify-center w-full">
              <InputOtp
                length={6}
                isRequired
                value={otp}
                onValueChange={(value) => setOtp(value)}
                className="text-white justify-center"
                variant="flat"
                size="lg"
                radius="lg"
                errorMessage="Please enter a valid OTP"
              />
            </div>

            <Button
              type="submit"
              color="primary"
              radius="sm"
              size="lg"
              className="text-base sm:text-lg font-semibold w-full"
              disabled={otp.length !== 6}
            >
              Continue <ArrowRight size={20}/>
            </Button>
            
            <Button
              onPress={handleBack}
              color="primary"
              radius="sm"
              size="lg"
              variant="bordered"
              className="text-base sm:text-lg font-semibold w-full"
            >
              <ArrowLeft size={20}/> Back 
            </Button>

            <div className="flex items-center justify-center mt-2 text-xs sm:text-sm">
              Don&apos;t have a code? 
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timer > 0 || resendLoading}
                className={`ml-1 ${
                  timer > 0
                    ? 'text-zinc-500 cursor-not-allowed' 
                    : 'text-primary cursor-pointer hover:underline'
                }`}
              >
                {resendLoading ? 'Sending...' : timer > 0 ? `Resend (${timer}s)` : 'Resend'}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
