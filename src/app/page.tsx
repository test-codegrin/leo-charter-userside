"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardBody, addToast } from "@heroui/react";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { AxiosError } from "axios";
import Image from "next/image";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // Prevent flash of content
  const router = useRouter();

  // ✅ Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      // User is already logged in, redirect to dashboard
      router.push(routes.trips);
      return;
    }

    setChecking(false); // Allow rendering if not authenticated
  }, [router]);

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

      // ✅ Handle 204 manually (Axios doesn't auto reject)
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

      router.push(routes.verify);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error("Send OTP Error:", err);

      const message =
        err.response?.data?.message ||
        `Unexpected error (${err.response?.status || "Network"})`;

      addToast({
        title: "Failed to Send OTP",
        description: message,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show nothing while checking auth status (prevents flash)
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-neutral-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center dark:bg-neutral-900 relative">
      <Image src="/assets/leo.png" alt="Leo Charter Services" width={200} height={60} className="absolute top-4 left-4"/>
      <Card className="w-[350px] md:w-[450px] bg-black text-white rounded-2xl shadow-2xl">
        <CardBody className="flex flex-col gap-6 p-6 md:p-12">
          <form onSubmit={handleSendOtp} className="flex flex-col gap-7">
            <h1 className="font-barlow text-2xl font-semibold text-center text-white tracking-tight">
              Sign In
            </h1>

            <Input
              isRequired
              isDisabled={loading}
              errorMessage="Please enter a valid email"
              label="Email Address"
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
              className="text-md mb-4 md:mb-0 font-sans"
            >
              Sign In
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
