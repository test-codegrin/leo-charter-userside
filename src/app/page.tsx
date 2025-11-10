"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardBody, addToast } from "@heroui/react";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { AxiosError } from "axios";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      addToast({
        title: "Missing Email",
        description: "Please enter your email address before proceeding.",
        color: "danger",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.sendOtp(email);

      // ✅ Handle 204 manually (Axios doesn’t auto reject)
      if (res.status === 204) {
        addToast({
          title: "Email Not Found",
          description: `We could not find any bookings associated with ${email}`,
          color: "warning",
        });
        return; // stop here
      }

      // ✅ Success
      localStorage.setItem("pendingEmail", email);
      localStorage.setItem("otpToken", res.data.token);

      addToast({
        title: "OTP Sent ✅",
        description: `OTP has been sent to ${email}. Please check your inbox.`,
        color: "success",
      });

      router.push(routes.verify);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error("Send OTP Error:", err);

      const message =
        err.response?.data?.message ||
        `Unexpected error (${err.response?.status || "Network"})`;

      addToast({
        title: "Failed to Send OTP ❌",
        description: message,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center dark:bg-neutral-900">
      <Card className="w-[400px] bg-black text-white rounded-3xl shadow-2xl">
        <CardBody className="flex flex-col gap-6 p-8">
          <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
            <h1 className="text-3xl font-semibold text-center text-white tracking-tight">
              Sign In
            </h1>

            <Input
              isRequired
              errorMessage="Please enter a valid email"
              label="Email"
              type="email"
              size="md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-white"
              variant="flat"
              radius="sm"
            />

            <Button
              isLoading={loading}
              type="submit"
              color="primary"
              radius="sm"
              size="md"
              className="text-md"
            >
              Send OTP
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
