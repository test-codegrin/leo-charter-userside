"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import { Button, Chip, Divider } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // ✅ Changed import
import { routes } from "@/lib/routes";

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
  invoiceLink: string;
  receiptUrl: string;
}

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const router = useRouter(); // ✅ Use the hook inside the component
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
    <div className="bg-neutral-900 rounded-3xl overflow-hidden transition-all duration-300">
      <div className="flex flex-col md:flex-row md:gap-6">
        
        {/* Vehicle Image */}
        <div className="shrink-0 w-full md:w-64 h-48 rounded-xl flex items-center justify-center overflow-hidden relative p-6">
          {vehicle?.vehicleImage ? (
          <div className="relative">
              <Image
              src={vehicle.vehicleImage}
              alt={vehicle.preferedVehicleType || "Vehicle"}
              className="object-contain"
              width={500}
              height={100}
            >
            
            </Image>
            <div className="lg:hidden absolute -top-4 -right-4">
              {trip.isQuoteAccepted === 1 && (
              <div className="flex items-center lg:w-35 gap-2 text-center bg-green-950 rounded-full px-2 py-1">
                <span className=" text-neutral-900 h-4 w-4 bg-green-300 rounded-full font-bold flex text-xs items-center justify-center">✓</span>
                <span className="text-green-300 text-[11px]">Quote Accepted</span>
              </div>
            )}
            </div>
            
            </div>
          ) : (
            <div className="text-zinc-600">No Image</div>
          )}
        </div>

        {/* Trip Details */}
        <div className="flex-1 space-y-3 p-6">
          {/* Header with Status Badge */}
          <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold text-white">
                {pickup && formatDateTime(pickup.pickUpDate, pickup.pickUpTime)}
              </h2>

            <div className="lg:block hidden">
              {trip.isQuoteAccepted === 1 && (
              <div className="flex items-center gap-2 text-center bg-green-950 rounded-full p-2">
                <span className=" text-neutral-900 h-4 w-4 bg-green-300 rounded-full font-bold flex text-xs items-center justify-center">✓</span>
                <span className="font-bold text-green-300 text-xs">Quote Accepted</span>
              </div>
            )}
            </div>
          </div>

          <div className="text-white text-md">
            {vehicle?.preferedVehicleType || "Vehicle Type Not Specified"} 
          </div>

          {/* Service Type */}
          <div className="flex items-center gap-2">
            <span className="text-md font-medium text-white">{trip.service}</span>
          </div>

          {/* Location Info */}
          {pickup && (
            <div className="flex items-center gap-2 text-white text-md mt-5">
              <div className="w-3 h-3 bg-white rounded-full mx-2" />
              <div>
                <p className="font-medium text-white text-md">{pickup.pickUpAddress}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex w-full">
        <Button
            color="default"
            variant="light"
            onPress={() => router.push(`/trips/${trip.id}`)}
            className="w-full font-semibold text-md text-primary"
          >
            Details
          </Button>
          {trip.invoiceLink && (
            <>
            <div className="w-1 bg-primary rounded-full"/>
            <Button
              color="default"
              variant="light"
              onPress={() => window.open(trip.invoiceLink, "_blank")}
              className="w-full font-semibold text-md text-primary"
            >
              Invoice
            </Button>
            </>
          )}
          {trip.receiptUrl && (
            <>
            <div className="w-1 bg-primary rounded-full"/>
            <Button
              color="default"
              variant="light"
              onPress={() => window.open(trip.receiptUrl, "_blank")}
              className="w-full font-semibold text-md text-primary"
            >
              Payment Receipt
            </Button>
            </>
          )}
       </div>
    </div>
  );
}
