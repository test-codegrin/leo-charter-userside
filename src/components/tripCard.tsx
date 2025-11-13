"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import { Button, Chip } from "@heroui/react";
import Image from "next/image";

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
  service: string;
  fleet: FleetItem[];
  itinerary: Itinerary;
  created_at: string;
}

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const pickup = trip.itinerary.pickups[0];
  const dropoff = trip.itinerary.dropoffs[0];
  const vehicle = trip.fleet[0];

  // Format date like "Thursday, November 20th, 2025 - 1:15am"
  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date} ${time}`);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const month = dateObj.toLocaleDateString("en-US", { month: "long" });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    
    // Get day suffix (st, nd, rd, th)
    const suffix = 
      day === 1 || day === 21 || day === 31 ? "st" :
      day === 2 || day === 22 ? "nd" :
      day === 3 || day === 23 ? "rd" : "th";

    const formattedTime = dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();

    return `${dayName}, ${month} ${day}${suffix}, ${year} - ${formattedTime}`;
  };

  return (
    <div className="bg-neutral-900 rounded-2xl overflow-hidden transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Vehicle Image */}
        <div className="shrink-0 w-full md:w-64 h-48 rounded-xl flex items-center justify-center overflow-hidden relative">
          {vehicle?.vehicleImage ? (
            <Image
              src={vehicle.vehicleImage}
              alt={vehicle.preferedVehicleType || "Vehicle"}
              className="object-contain"
              width={500}
              height={100}
            />
          ) : (
            <div className="text-zinc-600">No Image</div>
          )}
        </div>

        {/* Trip Details */}
        <div className="flex-1 space-y-4">
          {/* Header with Status Badge */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                {pickup && formatDateTime(pickup.pickUpDate, pickup.pickUpTime)}
              </h2>
              <p className="text-zinc-400 text-sm">
                {vehicle?.preferedVehicleType || "Vehicle Type Not Specified"} 
              </p>
            </div>
            {trip.isQuoteAccepted === 1 && (
              <Chip
                color="success"
                variant="flat"
                startContent={
                  <span className="text-green-500 text-base">✓</span>
                }
                className="font-medium"
              >
                Quote Accepted
              </Chip>
            )}
          </div>

          {/* Service Type */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-400">{trip.service}</span>
          </div>

          {/* Location Info */}
          {pickup && (
            <div className="flex items-start gap-2 text-white">
              <MapPin size={20} className="text-zinc-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{pickup.pickUpAddress}</p>
                {dropoff && (
                  <p className="text-zinc-400 text-sm mt-1">
                    → {dropoff.dropOffAddress}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Details Button */}
          <Button
            className="bg-transparent border border-neutral-700 text-white hover:bg-neutral-800 mt-4"
            size="md"
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
}
