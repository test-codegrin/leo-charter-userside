"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import { Button, Chip, Divider } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  invoiceTitle: string;
  invoiceLink: string;
  receiptUrl: string;
}

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const router = useRouter();
  const pickup = trip.itinerary.pickups[0];
  const dropoff = trip.itinerary.dropoffs[0];
  const vehicle = trip.fleet[0];
  const hasMultipleFleets = trip.fleet && trip.fleet.length > 1;

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
    <div className="bg-palette-bg rounded-2xl w-full overflow-hidden transition-all duration-300 relative">
      <div className="absolute top-2 right-2">
        {trip.isQuoteAccepted === 1 && (
          <div className="flex items-center gap-2 text-center bg-palette-success-main rounded-full px-2 py-1">
            <span className=" text-neutral-900 h-3.5 w-3.5 bg-palette-success-light rounded-full font-bold flex text-xs items-center justify-center">✓</span>
            <span className=" text-palette-success-light font-bold font-sans text-xs">Quote Accepted</span>
          </div>
        )}
      </div>

      <div className="flex px-8 pt-8 pb-4 flex-col md:flex-row md:gap-6">
        
        {/* Vehicle Image - Always show first fleet's image */}
        <div className="w-full md:w-44 flex items-center ">
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
        <div className="flex flex-col gap-2">
          
          <h2 className="md:text-lg text-base font-barlow font-semibold text-white">
            {trip.invoiceTitle || formatDateTime(pickup.pickUpDate, pickup.pickUpTime)}
          </h2>
          
          {/* Vehicle Type(s) - Always show all */}
          {hasMultipleFleets ? (
            <div className="flex flex-col gap-1">
              {trip.fleet.map((fleetItem, index) => (
                <div key={index} className="text-white text-sm font-sans">
                  {fleetItem.preferedVehicleType || "Vehicle Type Not Specified"}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white text-sm font-sans">
              {vehicle?.preferedVehicleType || "Vehicle Type Not Specified"} 
            </div>
          )}

          {/* Service Type */}
          <div className="flex items-center">
            <span className="text-sm font-sans font-medium text-white ">{trip.service}</span>
          </div>

          {/* Location Info */}
          {pickup && (
            <div className="flex items-center px-4 py-1.5 text-white">
              <div className="w-3 h-3 bg-white rounded-full mx-2" />
              <div>
                <p className="font-sans text-white text-sm">{pickup.pickUpAddress}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex md:flex-row flex-col px-1.5 py-2 w-full">
        <Button
          color="default"
          variant="light"
          onPress={() => router.push(`/trips/${trip.id}`)}
          className="w-full font-semibold text-sm font-sans text-palette-primary"
          size="sm"
        >
          Details
        </Button>
        {trip.invoiceLink && (
          <>
            <div className="w-0.5 bg-palette-primary opacity-50 rounded-full md:block hidden"/>
            <Button
              color="default"
              variant="light"
              onPress={() => window.open(trip.invoiceLink, "_blank")}
              className="w-full font-semibold text-sm font-sans text-palette-primary"
              size="sm"
            >
              Invoice
            </Button>
          </>
        )}
        {trip.receiptUrl && (
          <>
            <div className="w-0.5 bg-palette-primary opacity-50 rounded-full md:block hidden"/>
            <Button
              color="default"
              variant="light"
              onPress={() => window.open(trip.receiptUrl, "_blank")}
              className="w-full font-semibold text-sm font-sans text-palette-primary"
              size="sm"
            >
              Payment Receipt
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
