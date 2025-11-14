"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, addToast, InputOtp } from "@heroui/react";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { AxiosError } from "axios";

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
      router.push(routes.login);
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
        router.push(routes.trips);
      } else {
        addToast({
          title: "Invalid OTP ❌",
          description: "Please enter the correct OTP or request a new one.",
          color: "danger",
        });
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error(err);
      addToast({
        title: "Verification Failed ⚠️",
        description: err.response?.data?.message || "OTP invalid or expired.",
        color: "danger",
      });
    } finally {
      setLoading(false);
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
        title: "OTP Resent 🔁",
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
        title: "Resend Failed ❌",
        description: "Unable to resend OTP. Please try again.",
        color: "danger",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center dark:bg-neutral-900">
      <Card className="w-[400px] bg-black text-white rounded-3xl shadow-2xl">
        <CardBody className="flex flex-col gap-6 p-8 items-center justify-center">
          <form
            onSubmit={handleVerify}
            className="flex flex-col gap-6 w-full items-center"
          >
            <h1 className="text-3xl font-semibold text-center text-white tracking-tight">
              Verify OTP
            </h1>

            <p className="text-center text-sm text-zinc-400">
              OTP sent to <b>{email}</b>
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
              isLoading={loading}
              type="submit"
              color="primary"
              radius="sm"
              size="md"
              className="text-md w-full"
            >
              Verify OTP
            </Button>

            <div className="flex items-center justify-center mt-2">
              <Button
                disabled={timer > 0}
                isLoading={resendLoading}
                onPress={handleResendOtp}
                variant="flat"
                color={timer > 0 ? "default" : "secondary"}
                className="text-sm font-medium"
              >
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
