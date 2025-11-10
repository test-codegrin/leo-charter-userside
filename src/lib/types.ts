// src/app/lib/types.ts
export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  phoneNo: string;
  address?: string;
  cityName?: string;
  postalCode?: string;
  company?: string;
}

export interface BookingPayload {
  fleets: number[];
  invoiceId?: number;
  tripId: number;
  quotedAmount: number;
  invoiceTitle: string;
  description: string;
  issueDate: string;
  dueDate: string;
  preferedVehicleType: string;
  quantity: number;
  gratuities: number;
  tax: number;
  totalAmount: number;
  send: boolean;
}
