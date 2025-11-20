// app/(dashboard)/trips/[tripId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner, Button, addToast, Progress } from "@heroui/react";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { AxiosError } from "axios";
import { ChevronLeft } from "lucide-react";
import DataCard from "@/components/dataCard";
import TermsAndConditions from "@/components/TermsAndConditions";

interface Pickup {
  order: number;
  itineraryId: number;
  pickUpDate: string;
  pickUpTime: string;
  pickups: string;
}

interface Dropoff {
  order: number;
  itineraryId: number;
  returnDate: string;
  returnTime: string;
  dropoffs: string;
}

interface Itinerary {
  pickup: Pickup[];
  dropoff: Dropoff[];
}

interface FleetItem {
  fleetId: number;
  vehicleClass: string;
  preferedVehicleType: string;
  quantity: string;
  amount: string;
  tax: string;
  gratuities: string;
  total: string;
}

interface Stop {
  stopId: number;
  tripid: number;
  stopName: string;
  stopOrder: number;
  address: string;
  date: string | null;
  time: string;
}

interface Invoice {
  invoiceid: number;
  invoiceLink: string;
  quotedAmount: string;
  invoiceTitle: string;
  description: string;
  issueDate: string;
  dueDate: string;
  gratuities: string;
  tax: string;
  totalAmount: string;
}

interface Driver {
  id: number;
  driverId: number;
  driverName: string;
  phoneNo: string;
}

interface Summary {
  summaryId: number;
  summary: string;
}

interface TripDetail {
  tripId: number;
  externalTripId: string;
  userId: number;
  invoiceTitle: string;
  serviceOption: string;
  distance: string;
  travelTime: string;
  numberOfPassengers: number;
  noteToUs: string;
  functions: string;
  modifiedBy: string;
  isQuoteAccepted: number;
  flightNumber: string;
  created_at: string;
  updated_at: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  company: string;
  itineraries: Itinerary[];
  fleet: FleetItem[];
  stops: Stop[];
  invoice: Invoice[];
  driver: Driver[];
  summary: Summary[];
}

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
}

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const tripId = Number(params.tripId);

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date} ${time}`);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const month = dateObj.toLocaleDateString("en-US", { month: "long" });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    
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

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
          addToast({
            title: "Unauthorized",
            description: "Please login first.",
            color: "danger",
          });
          router.push(routes.login);
          return;
        }

        if (!tripId || isNaN(tripId)) {
          addToast({
            title: "Invalid Trip ID",
            description: "The trip ID provided is invalid.",
            color: "danger",
          });
          router.push(routes.trips);
          return;
        }

        const res = await authAPI.getTripById(tripId, token);

        if (res.data.success) {
          setTrip(res.data.trip);
        } else {
          throw new Error("Failed to fetch trip details");
        }
      } catch (err: unknown) {
        console.error("Error loading trip details:", err);

        if (err instanceof AxiosError) {
          const axiosError = err as AxiosError<ErrorResponse>;
          const status = axiosError.response?.status;
          const message =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            axiosError.message;

          switch (status) {
            case 400:
              addToast({
                title: "Invalid Request",
                description: message || "The trip ID provided is invalid.",
                color: "danger",
              });
              router.push(routes.trips);
              break;

            case 401:
              addToast({
                title: "Session Expired",
                description:
                  message || "Your session has expired. Please login again.",
                color: "danger",
              });
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push(routes.login);
              break;

            case 403:
              addToast({
                title: "Access Denied",
                description:
                  message || "You are not authorized to view this trip.",
                color: "danger",
              });
              router.push(routes.trips);
              break;

            case 404:
              addToast({
                title: "Trip Not Found",
                description:
                  message || "The requested trip could not be found.",
                color: "warning",
              });
              router.push(routes.trips);
              break;

            case 500:
              addToast({
                title: "Server Error",
                description:
                  message ||
                  "Something went wrong on our end. Please try again later.",
                color: "danger",
              });
              break;

            default:
              if (axiosError.code === "ERR_NETWORK") {
                addToast({
                  title: "Network Error",
                  description:
                    "Unable to connect to the server. Please check your internet connection.",
                  color: "danger",
                });
              } else if (axiosError.code === "ECONNABORTED") {
                addToast({
                  title: "Request Timeout",
                  description: "The request took too long. Please try again.",
                  color: "warning",
                });
              } else {
                addToast({
                  title: "Error",
                  description:
                    message || "Failed to load trip details. Please try again.",
                  color: "danger",
                });
              }
          }
        } else {
          addToast({
            title: "Unexpected Error",
            description: "An unexpected error occurred. Please try again.",
            color: "danger",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTripDetails();
    }
  }, [tripId, router]);

  const taxAmount = ((Number(trip?.invoice[0]?.tax) * Number(trip?.invoice[0]?.quotedAmount)) / 100).toFixed(1);
  const gratuitiesAmount = ((Number(trip?.invoice[0]?.gratuities) * Number(trip?.invoice[0]?.quotedAmount)) / 100).toFixed(1);

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

  if (!trip) {
    return (
      <div className="min-h-screen flex overflow-x-hidden flex-col items-center justify-center text-white px-4">
        <h2 className="text-xl font-medium text-zinc-300 mb-2">
          Trip Not Found
        </h2>
        <Button onPress={() => router.push(routes.trips)} className="mt-4">
          Back to Trips
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 max-w-5xl py-4 sm:px-6 md:px-8 md:py-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-1 gap-2">
        <button
          onClick={() => router.push(routes.trips)}
          className="font-sans flex items-center gap-1 sm:gap-2 cursor-pointer text-palette-primary font-semibold text-sm sm:text-md"
        >
          <ChevronLeft size={20} className="sm:w-5 sm:h-5" />
          <span>BACK</span>
        </button>

        {trip.isQuoteAccepted === 1 && (
          <div className="flex items-center gap-1 sm:gap-2 text-center bg-green-950 rounded-full px-2 py-1">
            <span className="text-neutral-900 h-3 w-3 sm:h-4 sm:w-4 bg-green-300 rounded-full font-bold flex text-xs items-center justify-center">
              ✓
            </span>
            <span className="font-sans font-medium text-green-300 text-xs whitespace-nowrap">
              Quote Accepted
            </span>
          </div>
        )}
      </div>

      <div className="sm:ml-6">
        {/* Title */}
        <h2 className="font-barlow text-xl sm:text-2xl text-palette-primary font-semibold  mb-4 md:mb-5">
          Trip Details
          <span className="block sm:inline mt-1 sm:mt-0"> ({trip.externalTripId})</span>
        </h2>
        
        {/* Itinerary Section */}
        <div className="relative mb-6 md:mb-8">
          {/* Vertical connecting line */}
          <div className="absolute top-6 sm:top-7 left-[7px] w-[2px] bg-neutral-600 h-[calc(100%-4.5rem)] sm:h-[calc(100%-5.4rem)]" />
          
          <div className="flex flex-col gap-4 sm:gap-6 relative">
            {/* Pickup */}
            {trip.itineraries?.[0]?.pickup?.map((pickup: Pickup) => (
              <div className="flex items-start gap-3 sm:gap-5" key={pickup.itineraryId}>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded-full mt-1 z-10 flex-shrink-0" />
                <DataCard title="Pickup Address" value={pickup.pickups} />
              </div>
            ))}

            {/* Stops */}
            {trip.stops && trip.stops.length > 0 && (
              <>
                {trip.stops.map((stop: Stop, index: number) => (
                  <div
                    className="flex items-start gap-3 sm:gap-5 ml-6 sm:ml-9"
                    key={stop.stopId}
                  >
                    <DataCard 
                      title={`Stop ${index + 1} : ${stop.stopName}`} 
                      value={stop.address} 
                    />
                  </div>
                ))}
              </>
            )}

            {/* Dropoff */}
            {trip.itineraries?.[0]?.dropoff?.map((dropoff: Dropoff) => (
              <div className="flex items-start gap-3 sm:gap-5" key={dropoff.itineraryId}>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 mt-1 z-10 flex-shrink-0" />
                <DataCard title="Dropoff Address" value={dropoff.dropoffs} />
              </div>
            ))}
          </div>
        </div>

        {/* Trip Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-8">
          <DataCard title="Service Type" value={trip.serviceOption} />
          <DataCard 
            title="Pickup Date and Time" 
            value={formatDateTime(
              trip.itineraries?.[0]?.pickup?.[0]?.pickUpDate, 
              trip.itineraries?.[0]?.pickup?.[0]?.pickUpTime
            )} 
          />
          <DataCard 
            title="Return Date and Time" 
            value={formatDateTime(
              trip.itineraries?.[0]?.dropoff?.[0]?.returnDate, 
              trip.itineraries?.[0]?.dropoff?.[0]?.returnTime
            )} 
          />
          <DataCard title="Function" value={trip.functions} />
          <DataCard title="Number of Passengers" value={trip.numberOfPassengers} />
          <DataCard title="Vehicle Class" value={trip.fleet?.[0]?.vehicleClass} />
          <DataCard 
            title="Preferred Vehicle" 
            value={trip.fleet?.[0]?.preferedVehicleType} 
            className="md:col-span-2" 
          />
          <DataCard 
            title="Note to us" 
            value={trip.noteToUs} 
            className="md:col-span-2" 
          />
          <DataCard title="Promo Code" value={""} />
        </div>
        
        {/* Divider */}
        <div className="my-6 md:my-8 border-b-[0.5px] border-dashed border-neutral-700 w-full" />

        {/* Customer Details */}
        <div>
          <h2 className="font-barlow text-xl sm:text-2xl text-palette-primary font-semibold mb-6 md:mb-8">
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-8">
            <DataCard title="First Name" value={trip.firstName} />
            <DataCard title="Last Name" value={trip.lastName} />
            <DataCard title="Phone Number" value={trip.phoneNo} />
            <DataCard title="Email" value={trip.email} />
            <DataCard title="Company" value={trip.company} />
          </div>
          {trip.invoice[0]?.invoiceLink && (
         <div className="flex justify-end"  >
         <Button
            onPress={() => window.open(trip.invoice[0]?.invoiceLink, '_blank')}
            variant="solid"
            color="primary"
            className="font-sans font-bold"
          >
            View Invoice
          </Button>
         </div>
          )}
        </div>

        <div className="my-6 md:my-8 border-b-[0.5px] border-dashed border-neutral-700 w-full" />

        {/* Quotation */}
        <div>
          <h2 className="font-barlow text-xl sm:text-2xl text-palette-primary font-semibold mb-6 md:mb-8">
            Quotation
          </h2>
          <table className="w-full text-md">
          <tbody>
            <tr>
              <td className="text-neutral-400 w-50">Subtotal:</td>
              <td className="font-semibold">${Number(trip.invoice[0]?.quotedAmount).toFixed(1)}</td>
            </tr>
            <tr>
              <td className="text-neutral-400 w-50">Taxes:</td>
              <td className="font-semibold">${taxAmount}</td>
            </tr>
            <tr>
              <td className="text-neutral-400 w-50">Gratuities:</td>
              <td className="font-semibold">${gratuitiesAmount}</td>
            </tr>
            <tr>
              <td className="text-neutral-400 w-50">Total:</td>
              <td className="font-semibold">CA${Number(trip.invoice[0]?.totalAmount).toFixed(1)}</td>
            </tr>
          </tbody>
        </table>

        </div>

        <div className="my-6 md:my-8 border-b-[0.5px] border-dashed border-neutral-700 w-full" />

        {/* Driver Details */}
        {trip.driver?.[0]?.driverName && (
          <div>
            <h2 className="font-barlow text-xl sm:text-2xl text-palette-primary font-semibold mb-6 md:mb-8">
              Driver Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-8">
              <DataCard 
                title="First Name" 
                value={trip.driver[0]?.driverName?.split(" ")?.[0] ?? "N/A"} 
              />
              <DataCard 
                title="Last Name" 
                value={trip.driver[0]?.driverName?.split(" ")?.[1] ?? "N/A"} 
              />
              <DataCard 
                title="Phone Number" 
                value={trip.driver[0]?.phoneNo ?? "N/A"} 
              />
            </div>
            <div className="my-6 md:my-8 border-b-[0.5px] border-dashed border-neutral-700 w-full" />
          </div>
        )}
        
        {/* Terms and Conditions */}
        <TermsAndConditions />
      </div>
    </div>
  );
}
