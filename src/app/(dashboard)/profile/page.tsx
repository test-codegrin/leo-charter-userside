"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, addToast, Progress } from "@heroui/react";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { AxiosError } from "axios";

type UserProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNo?: string;
  address?: string;
  provinceName?: string;
  cityName?: string;
  postalCode?: string;
  company?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNo: "",
    address: "",
    provinceName: "",
    cityName: "",
    postalCode: "",
    company: "",
    email: "",
  });

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        addToast({
          title: "Not logged in",
          description: "Please sign in.",
          color: "danger",
        });
        router.push(routes.login);
        return;
      }

      try {
        const res = await authAPI.getProfile(token);
        const u = res.data.user as UserProfile;

        setUser(u);
        setForm({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phoneNo: u.phoneNo || "",
          address: u.address || "",
          provinceName: u.provinceName || "",
          cityName: u.cityName || "",
          postalCode: u.postalCode || "",
          company: u.company || "",
          email: u.email || "",
        });

        localStorage.setItem("user", JSON.stringify(u));
      } catch (err) {
        console.error("Profile load error:", err);
        addToast({
          title: "Failed to load profile",
          description: "Please login again.",
          color: "danger",
        });
        localStorage.clear();
        router.push(routes.login);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
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

  if (!user) return null;

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
      addToast({
        title: "Unauthorized",
        description: "Please login again.",
        color: "danger",
      });
      router.push(routes.login);
      return;
    }

    const payload = {
      firstName: String(form.firstName || "").trim(),
      lastName: String(form.lastName || "").trim(),
      phoneNo: String(form.phoneNo || "").trim(),
      address: String(form.address || "").trim(),
      provinceName: String(form.provinceName || "").trim(),
      cityName: String(form.cityName || "").trim(),
      postalCode: String(form.postalCode || "").trim(),
      company: String(form.company || "").trim(),
    };

    try {
      const res = await authAPI.updateProfile(payload, token);
      const updated = res.data.user as UserProfile;

      setUser(updated);
      setForm({
        firstName: updated.firstName || "",
        lastName: updated.lastName || "",
        phoneNo: updated.phoneNo || "",
        address: updated.address || "",
        provinceName: updated.provinceName || "",
        cityName: updated.cityName || "",
        postalCode: updated.postalCode || "",
        company: updated.company || "",
        email: updated.email || "",
      });

      // ✅ Update localStorage
      const oldValue = localStorage.getItem("user");
      localStorage.setItem("user", JSON.stringify(updated));

      // ✅ Manually dispatch storage event for same tab
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "user",
          oldValue: oldValue,
          newValue: JSON.stringify(updated),
          url: window.location.href,
          storageArea: localStorage,
        })
      );

      addToast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        color: "success",
      });
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error("Save profile error:", err);
      addToast({
        title: "Update Failed ❌",
        description:
          err?.response?.data?.message || "Unable to update profile.",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-sans min-h-screen text-white mt-10">
      <section className="rounded-2xl w-full">
        <h3 className="text-xl font-semibold mb-6 text-zinc-100">
          Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            value={form.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            label="First Name"
            placeholder="First Name"
            size="lg"
            radius="md"
            variant="flat"
          />
          <Input
            value={form.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            label="Last Name"
            placeholder="Last Name"
            size="lg"
            radius="md"
            variant="flat"
          />

          <Input
            isDisabled
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            label="Email"
            placeholder="Email"
            size="lg"
            radius="md"
            variant="flat"
          />

          <Input
            value={form.phoneNo}
            onChange={(e) => handleChange("phoneNo", e.target.value)}
            label="Phone number"
            placeholder="Phone number"
            size="lg"
            radius="md"
            variant="flat"
          />

          <Input
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            label="Address"
            placeholder="Address"
            size="lg"
            radius="md"
            variant="flat"
          />

          <Input
            value={form.cityName}
            onChange={(e) => handleChange("cityName", e.target.value)}
            label="City"
            placeholder="City"
            size="lg"
            radius="md"
            variant="flat"
          />

          <Input
            value={form.provinceName}
            onChange={(e) => handleChange("provinceName", e.target.value)}
            placeholder="Province"
            label="Province"
            size="lg"
            radius="md"
            variant="flat"
          />

          <Input
            value={form.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            placeholder="Postal Code"
            label="Postal Code"
            size="lg"
            radius="md"
            variant="flat"
          />

          <Input
            value={form.company}
            onChange={(e) => handleChange("company", e.target.value)}
            placeholder="Company"
            label="Company"
            size="lg"
            radius="md"
            variant="flat"
          />
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <Button
            color="primary"
            isLoading={saving}
            onPress={handleSave}
            radius="md"
            size="md"
            className="font-medium text-md"
          >
            Save Changes
          </Button>
        </div>
      </section>
    </div>
  );
}
