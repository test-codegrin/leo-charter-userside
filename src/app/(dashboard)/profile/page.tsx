"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, addToast, Spinner } from "@heroui/react";
import { Edit2, Save, X } from "lucide-react";
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
  cityName?: string;
  postalCode?: string;
  company?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNo: "",
    address: "",
    cityName: "",
    postalCode: "",
    company: "",
    email: "",
  });

  // ✅ Load profile
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        addToast({ title: "Not logged in", description: "Please sign in.", color: "danger" });
        router.push(routes.login);
        return;
      }

      try {
        const res = await authAPI.getProfile(token);
        const u = res.data.user as UserProfile;

        // ✅ Update both state and localStorage immediately
        setUser(u);
        setForm({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phoneNo: u.phoneNo || "",
          address: u.address || "",
          cityName: u.cityName || "",
          postalCode: u.postalCode || "",
          company: u.company || "",
          email: u.email || "",
        });

        localStorage.setItem("user", JSON.stringify(u)); // ensure sync
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
      <div className="min-h-screen bg-neutral-950 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Spinner size="lg" color="primary" />
            <div className="text-zinc-300">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    if (!user) return;
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNo: user.phoneNo || "",
      address: user.address || "",
      cityName: user.cityName || "",
      postalCode: user.postalCode || "",
      company: user.company || "",
      email: user.email || "",
    });
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
      addToast({ title: "Unauthorized", description: "Please login again.", color: "danger" });
      router.push(routes.login);
      return;
    }

    const payload = {
  firstName: String(form.firstName || "").trim(),
  lastName: String(form.lastName || "").trim(),
  phoneNo: String(form.phoneNo || "").trim(),
  address: String(form.address || "").trim(),
  cityName: String(form.cityName || "").trim(),
  postalCode: String(form.postalCode || "").trim(),
  company: String(form.company || "").trim(),
};


    try {
      const res = await authAPI.updateProfile(payload, token);
      const updated = res.data.user as UserProfile;

      // ✅ Update React state and localStorage
      setUser(updated);
      setForm({
        firstName: updated.firstName || "",
        lastName: updated.lastName || "",
        phoneNo: updated.phoneNo || "",
        address: updated.address || "",
        cityName: updated.cityName || "",
        postalCode: updated.postalCode || "",
        company: updated.company || "",
        email: updated.email || "",
      });

      localStorage.setItem("user", JSON.stringify(updated)); // ✅ Keep localStorage synced

      addToast({
        title: "Profile Updated ✅",
        description: "Your profile has been updated successfully.",
        color: "success",
      });

      setEditing(false);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error("Save profile error:", err);
      addToast({
        title: "Update Failed ❌",
        description: err?.response?.data?.message || "Unable to update profile.",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-4">
      
        <section className="rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-zinc-100">Profile Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "First Name", key: "firstName" },
              { label: "Last Name", key: "lastName" },
              { label: "Phone", key: "phoneNo" },
              { label: "Company", key: "company" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-sm text-zinc-400 mb-1 block">{field.label}</label>
                <Input
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => handleChange(field.key as keyof typeof form, e.target.value)}
                  isDisabled={!editing}
                  placeholder={field.label}
                  size="lg"
                  radius="sm"
                  variant="flat"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="text-sm text-zinc-400 mb-1 block">Address</label>
              <Input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                isDisabled={!editing}
                placeholder="Address"
                size="lg"
                radius="sm"
                variant="flat"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">City</label>
              <Input
                value={form.cityName}
                onChange={(e) => handleChange("cityName", e.target.value)}
                isDisabled={!editing}
                placeholder="City"
                size="lg"
                radius="sm"
                variant="flat"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Postal Code</label>
              <Input
                value={form.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                isDisabled={!editing}
                placeholder="Postal Code"
                size="lg"
                radius="sm"
                variant="flat"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-zinc-400 mb-1 block">Email (read-only)</label>
              <Input
                value={form.email}
                isDisabled
                placeholder="Email"
                size="lg"
                radius="sm"
                variant="flat"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            {!editing ? (
              <Button color="primary" onPress={handleEdit}>
                <Edit2 size={14} /> Edit Profile
              </Button>
            ) : (
              <>
                <Button color="primary" isLoading={saving} onPress={handleSave}>
                  <Save size={14} /> Save Changes
                </Button>
                <Button color="default" variant="flat" onPress={handleCancel}>
                  <X size={14} /> Cancel
                </Button>
              </>
            )}
          </div>
        </section>
      
    </div>
  );
}
