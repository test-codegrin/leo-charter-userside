"use client";

import { useEffect, useState } from "react";
import { Spinner, Button, addToast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { RefreshCcw } from "lucide-react";
import TripCard from "@/components/tripCard";

interface FleetItem {
  vehicleClass: string;
  preferedVehicleType: string;
  vehicleImage: string;
}

interface Itinerary {
  pickups: {
    pickUpAddress: string;
    pickUpDate: string;
    pickUpTime: string;
  }[];
  dropoffs: {
    dropOffAddress: string;
    dropOffDate: string;
    dropOffTime: string;
  }[];
}

interface Trip {
  id: number;
  externalTripId: string;
  isQuoteAccepted: number;
  test: number;
  customer: string;
  email: string;
  service: string;
  quotationDescription: string | null;
  created_at: string;
  updated_at: string;
  fleet: FleetItem[];
  itinerary: Itinerary;
  invoiceLink: string;
  receiptUrl: string;
}

export default function TripsPage() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const userData = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!userData || !token) {
          addToast({
            title: "Unauthorized",
            description: "Please login first.",
            color: "danger",
          });
          router.push(routes.login);
          return;
        }

        const user = JSON.parse(userData);
        const res = await authAPI.getUserTrips(user.userId, token);
        setTrips(res.data.data || []);
      } catch (err) {
        console.error("Error loading trips:", err);
        addToast({
          title: "Error",
          description: "Failed to load trips. Try again later.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-medium text-zinc-300 mb-2">No Trips Found</h2>
        <p className="text-zinc-500 mb-4">You have not booked any trips yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Trips</h1>
        <Button
          variant="flat"
          startContent={<RefreshCcw size={16} />}
          onPress={() => window.location.reload()}
          className="hidden md:flex"
        >
          Refresh
        </Button>
      </div>

      {/* Trip Cards */}
      <div className="space-y-6">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  );
}
