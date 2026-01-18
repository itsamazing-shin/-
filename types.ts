import { Timestamp } from 'firebase/firestore';

export type TableType = '일반' | '애견' | '단체';

export interface Reservation {
  id: string;
  guestName: string;
  guestCount: number;
  carNumbers: string[]; // List of registered car numbers
  checkInDate: string; // Format: YYYY-MM-DD
  parkedCarCount: number; // Currently parked cars
  contact?: string;

  // New Detailed Fields
  tableNumber: string; // e.g., "15", "A-1"
  tableType: TableType;
  tableCount: number; // Number of tables booked
  hasCar: boolean; // "Car included" flag
  seatFee: number; // 200,000 per table
  deposit: number; // 20,000 per table
  totalCost: number; // Total amount to be paid
}

export interface ParkingLog {
  id: string;
  reservationId: string | null; // null if walk-in
  carNumber: string;
  entryTime: Date; // Changed to native Date for simulation
  isPaid: boolean;
  amount: number;
  handledBy?: string;
}

export interface DailyStats {
  totalReservations: number;
  totalGuests: number;
  currentParked: number;
  totalRevenue: number;
}