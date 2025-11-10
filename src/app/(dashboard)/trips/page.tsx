"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Button, Avatar, addToast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { Calendar, Clock, MapPin, RefreshCcw } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white">
        <h2 className="text-xl font-medium text-zinc-300 mb-2">No Trips Found</h2>
        <p className="text-zinc-500 mb-4">You haven’t booked any trips yet.</p>
        <Button color="primary" onPress={() => router.push(routes.dashboard)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">My Trips</h1>
          <Button
            variant="flat"
            startContent={<RefreshCcw size={16} />}
            onPress={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden">
          <Table
            aria-label="User Trips Table"
            removeWrapper
            className="text-sm"
          >
            <TableHeader>
              <TableColumn>Trip ID</TableColumn>
              <TableColumn>Service</TableColumn>
              <TableColumn>Vehicle</TableColumn>
              <TableColumn>Pick-up</TableColumn>
              <TableColumn>Drop-off</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Created On</TableColumn>
            </TableHeader>

            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id} className="hover:bg-neutral-800 transition">
                  <TableCell>
                    <p className="font-medium text-primary">{trip.externalTripId}</p>
                  </TableCell>

                  <TableCell>
                    {trip.service || <span className="text-zinc-500">—</span>}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {trip.fleet[0]?.vehicleImage ? (
                        <Avatar
                          src={trip.fleet[0].vehicleImage}
                          alt="Vehicle"
                          size="sm"
                          className="border border-neutral-700"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-neutral-700 rounded-full" />
                      )}
                      <span className="text-sm">
                        {trip.fleet[0]?.preferedVehicleType || "—"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {trip.itinerary.pickups.length > 0 ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-zinc-300">
                          <MapPin size={14} />
                          <span className="truncate max-w-[220px]">
                            {trip.itinerary.pickups[0].pickUpAddress}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500 text-xs">
                          <Calendar size={12} />
                          {trip.itinerary.pickups[0].pickUpDate} &nbsp;
                          <Clock size={12} />
                          {trip.itinerary.pickups[0].pickUpTime}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    {trip.itinerary.dropoffs.length > 0 ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-zinc-300">
                          <MapPin size={14} />
                          <span className="truncate max-w-[220px]">
                            {trip.itinerary.dropoffs[0].dropOffAddress}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500 text-xs">
                          <Calendar size={12} />
                          {trip.itinerary.dropoffs[0].dropOffDate} &nbsp;
                          <Clock size={12} />
                          {trip.itinerary.dropoffs[0].dropOffTime}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trip.isQuoteAccepted
                          ? "bg-green-600/20 text-green-400 border border-green-600/40"
                          : "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40"
                      }`}
                    >
                      {trip.isQuoteAccepted ? "Accepted" : "Pending"}
                    </span>
                  </TableCell>

                  <TableCell>
                    {new Date(trip.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
