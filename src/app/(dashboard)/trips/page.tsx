"use client";
import { useEffect, useState } from "react";
import { Button, addToast, Progress, Select, SelectItem } from "@heroui/react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import TripCard from "@/components/tripCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

        const res = await authAPI.getUserTrips(user.userId, token, page, limit);

        setTrips(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
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

    setLoading(true);
    fetchTrips();
  }, [router, page, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Progress
          isIndeterminate
          aria-label="Loading..."
          className="max-w-xs w-full"
          size="sm"
          color="primary"
        />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-medium text-zinc-300 mb-2">
          No Trips Found
        </h2>
        <p className="text-zinc-500 mb-4">You have not booked any trips yet.</p>
      </div>
    );
  }

  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <div className=" text-white">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-xl font-barlow font-semibold">Trips</h1>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end mt-8 px-2 gap-2 sm:gap-6">
        <span className="text-white font-sans text-sm">Cards per page:</span>

        <div className="w-16">
          <Select
            className="bg-black text-white"
            selectedKeys={[String(limit)]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              setLimit(Number(selected));
              setPage(1);
            }}
            size="sm"
            aria-label="Cards per page"
            radius="sm"
            variant="flat"
          >
            {[5, 10, 20].map((n) => (
              <SelectItem key={n} textValue={n.toString()}>
                {n}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="text-white font-sans text-sm text-center">
          {firstItem}-{lastItem} of {total}
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="light"
            radius="sm"
            isIconOnly
            className="bg-black"
            disabled={page === 1}
            onPress={() => setPage(page - 1)}
          >
            <ChevronLeft color={page === 1 ? "gray" : "white"} size={20}/>
          </Button>
          <Button
            size="sm"
            variant="light"
            radius="sm"
            isIconOnly
            className="bg-black"
            disabled={page === totalPages}
            onPress={() => setPage(page + 1)}
          >
            <ChevronRight color={page === totalPages ? "gray" : "white"} size={20}/>
          </Button>
        </div>
      </div>
    </div>
  );
}
