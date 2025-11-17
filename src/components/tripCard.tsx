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
    <div className="bg-neutral-900 rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-300 relative">
       <div className="absolute lg:top-4 lg:right-4 top-2 right-2">
              {trip.isQuoteAccepted === 1 && (
              <div className="flex items-center lg:w-35 gap-2 text-center bg-green-950 rounded-full px-2 py-1">
                <span className=" text-neutral-900 h-4 w-4 bg-green-300 rounded-full font-bold flex text-xs items-center justify-center">✓</span>
                <span className="font-medium text-green-300 lg:text-sm text-xs">Quote Accepted</span>
              </div>
            )}
            </div>
      <div className="flex flex-col md:flex-row md:gap-6">
        
        {/* Vehicle Image */}
        <div className="shrink-0 w-full md:w-64 h-48 rounded-xl flex items-center justify-center overflow-hidden relative p-6">
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
        <div className="flex-1 space-y-3 p-6 md:mt-4">
          {/* Header with Status Badge */}
          
              <h2 className="md:text-xl text-md font-semibold text-white">
                {pickup && formatDateTime(pickup.pickUpDate, pickup.pickUpTime)}
              </h2>
          

          <div className="text-white text-sm">
            {vehicle?.preferedVehicleType || "Vehicle Type Not Specified"} 
          </div>

          {/* Service Type */}
          <div className="flex items-center gap-2">
            <span className="text-md font-medium text-white md:no-underline underline underline-offset-6 decoration-dotted ">{trip.service}</span>
          </div>

          {/* Location Info */}
          {pickup && (
            <div className="flex items-center gap-2 text-white mt-5">
              <div className="w-3 h-3 bg-white rounded-full mx-2" />
              <div>
                <p className="font-medium text-white text-md md:no-underline underline underline-offset-6 decoration-dotted">{pickup.pickUpAddress}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex md:flex-row flex-col w-full">
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
            <div className="w-1 bg-primary rounded-full md:block hidden"/>
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
            <div className="w-1 bg-primary rounded-full md:block hidden"/>
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
