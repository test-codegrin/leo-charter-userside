"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner, Button, addToast } from "@heroui/react";
import { authAPI } from "@/lib/api";
import { routes } from "@/lib/routes";
import { AxiosError } from "axios"; // ✅ Import AxiosError
import {    
  ChevronLeft,
} from "lucide-react";
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

// ✅ Define error response type
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

        // Validate tripId
        if (!tripId || isNaN(tripId)) {
          addToast({
            title: "Invalid Trip ID",
            description: "The trip ID provided is invalid.",
            color: "danger",
          });
          //   router.push(routes.trips);
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

        // ✅ Handle Axios errors with specific status codes
        if (err instanceof AxiosError) {
          const axiosError = err as AxiosError<ErrorResponse>;
          const status = axiosError.response?.status;
          const message =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            axiosError.message;

          switch (status) {
            case 400:
              // Bad Request - Invalid trip ID format
              addToast({
                title: "Invalid Request",
                description: message || "The trip ID provided is invalid.",
                color: "danger",
              });
              //   router.push(routes.trips);
              break;

            case 401:
              // Unauthorized - Invalid or expired token
              addToast({
                title: "Session Expired",
                description:
                  message || "Your session has expired. Please login again.",
                color: "danger",
              });
              // Clear invalid tokens
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push(routes.login);
              break;

            case 403:
              // Forbidden - User doesn't own this trip
              addToast({
                title: "Access Denied",
                description:
                  message || "You are not authorized to view this trip.",
                color: "danger",
              });
              //   router.push(routes.trips);
              break;

            case 404:
              // Not Found - Trip doesn't exist
              addToast({
                title: "Trip Not Found",
                description:
                  message || "The requested trip could not be found.",
                color: "warning",
              });
              //   router.push(routes.trips);
              break;

            case 500:
              // Server Error
              addToast({
                title: "Server Error",
                description:
                  message ||
                  "Something went wrong on our end. Please try again later.",
                color: "danger",
              });
              break;

            default:
              // Network or other errors
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
          // Non-Axios errors
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
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
    <div className="min-h-screen p-4 md:p-8 text-white">
      {/* Header */}
      <div className="flex items-center gap-4 justify-between mb-1">
        <div className="flex justify-center">
          <button
            onClick={() => router.push(routes.trips)}
            className="flex items-center gap-2 cursor-pointer text-primary font-semibold text-md"
          >
            <ChevronLeft size={25} />
            <span>BACK</span>
          </button>
        </div>

        {trip.isQuoteAccepted === 1 && (
          <div className="flex items-center gap-2 text-center bg-green-950 rounded-full p-2">
            <span className=" text-neutral-900 h-4 w-4 bg-green-300 rounded-full font-bold flex text-xs items-center justify-center">
              ✓
            </span>
            <span className="font-bold text-green-300 text-xs">
              Quote Accepted
            </span>
          </div>
        )}
      </div>

      <div className="ml-6">
        <h2 className="text-3xl text-primary font-semibold mb-5 flex items-center gap-2">
          Trip Details ({trip.externalTripId})
        </h2>
        
        <div className="relative mb-8">
          {/* Vertical connecting line */}
          <div className="absolute top-7 left-[7px] w-[2px] bg-neutral-600 h-[calc(100%-5.4rem)]" />
          <div className="flex flex-col gap-6 relative">
            {/* Pickup */}
            {trip.itineraries?.[0]?.pickup?.map((pickup: Pickup) => (
              <div className="flex items-start gap-5" key={pickup.itineraryId}>
                <div className="w-4 h-4 bg-gray-300 rounded-full mt-1 z-10" />
                <DataCard title="Pickup Address" value={pickup.pickups} />
              </div>
            ))}

            {/* Stops (if any) */}
            {trip.stops && trip.stops.length > 0 && (
              <>
                {trip.stops.map((stop: Stop, index: number) => (
                  <div
                    className="flex items-start gap-5 ml-9"
                    key={stop.stopId}
                  >
                    <DataCard title={`Stop ${index + 1} : ${stop.stopName}`} value={stop.address} />
                  </div>
                ))}
              </>
            )}

            {/* Dropoff */}
            {trip.itineraries?.[0]?.dropoff?.map((dropoff: Dropoff) => (
              <div className="flex items-start gap-5" key={dropoff.itineraryId}>
                <div className="w-4 h-4 bg-gray-300 mt-1 z-10" />
                <DataCard title="Dropoff Address" value={dropoff.dropoffs} />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
              <DataCard title="Service Type" value={trip.serviceOption} />
              <DataCard title="Pickup Date and Time" value={formatDateTime(trip.itineraries?.[0]?.pickup?.[0]?.pickUpDate, trip.itineraries?.[0]?.pickup?.[0]?.pickUpTime)} />
              <DataCard title="Return Date and Time" value={formatDateTime(trip.itineraries?.[0]?.dropoff?.[0]?.returnDate, trip.itineraries?.[0]?.dropoff?.[0]?.returnTime)} />
              <DataCard title="Function" value={trip.functions} />
              <DataCard title="Number of Passengers" value={trip.numberOfPassengers} />
              <DataCard title="Vehicle Class" value={trip.fleet?.[0]?.vehicleClass} />
              <DataCard title="Preferred Vehicle" value={trip.fleet?.[0]?.preferedVehicleType} className="col-span-2" />
              <DataCard title="Note to us" value={trip.noteToUs} className="col-span-2" />
              <DataCard title="Promo Code" value={""} />
          </div>
          
            <div className="my-8 border-b-[0.5px] border-dashed border-neutral-700 w-full "/>

            <div>
                 <h2 className="text-3xl text-primary font-semibold mb-8 flex items-center gap-2 ">
                    Customer Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
                    <DataCard title="First Name" value={trip.firstName} />
                    <DataCard title="Last Name" value={trip.lastName} />
                    <DataCard title="Phone Number" value={trip.phoneNo} />
                    <DataCard title="Email" value={trip.email} />
                    <DataCard title="Company" value={trip.company} />
                </div>
            </div>

             <div className="my-8 border-b-[0.5px] border-dashed border-neutral-700 w-full "/>

             <div>
                 <h2 className="text-3xl text-primary font-semibold mb-8 flex items-center gap-2 ">
                    Quotation
                </h2>
                <div className={`flex flex-col`}>
                    <p className="text-md text-neutral-400 mb-1">Total Amount</p>
                    <p className="text-white text-lg">
                        <span className="font-bold">
                            CA${Number(trip.invoice[0].totalAmount).toFixed(0)}
                        </span>
                        <span className="text-lg text-neutral-400">
                            {" = "}CA${Number(trip.invoice[0].quotedAmount).toFixed(0)} plus {Number(trip.invoice[0].tax).toFixed(0)}% Tax plus {Number(trip.invoice[0].gratuities).toFixed(0)}% Gratuities
                        </span>
                    </p>
                    </div>
            </div>

            <div className="my-8 border-b-[0.5px] border-dashed border-neutral-700 w-full "/>

            {
              trip.driver && (
                <div>
                  <h2 className="text-3xl text-primary font-semibold mb-8 flex items-center gap-2 ">
                    Driver Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
                    <DataCard title="First Name" value={trip.driver[0].driverName.split(" ")[0]} />
                    <DataCard title="Last Name" value={trip.driver[0].driverName.split(" ")[1]} />
                    <DataCard title="Phone Number" value={trip.driver[0].phoneNo} />
                  </div>
                  <div className="my-8 border-b-[0.5px] border-dashed border-neutral-700 w-full "/>
                </div>
                
              )
            }
            
            <TermsAndConditions />
            


      </div>
    </div>
  );
}
