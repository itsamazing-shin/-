import { Reservation, ParkingLog, DailyStats, TableType } from '../types';

// Constants
export const PARKING_FEE = 20000;
export const FREE_PARKING_RATIO = 4; // 1 car per 4 people
export const TOTAL_PARKING_SPOTS = 50;

// --- MOCK DATA SIMULATION ---
let MOCK_RESERVATIONS: Reservation[] = [];
let MOCK_LOGS: ParkingLog[] = [];

// Helper: Generate Mock Data
const initMockData = () => {
  if (MOCK_RESERVATIONS.length > 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const tableTypes: TableType[] = ['일반', '애견', '단체'];
  
  // Helper for random car number
  const randomCar = () => {
    const chars = '가나다라마바사아자차';
    const front = Math.floor(Math.random() * 90) + 10;
    const back = Math.floor(Math.random() * 9000) + 1000;
    return `${front}${chars[Math.floor(Math.random() * chars.length)]}${back}`;
  };

  // Generate ~25 reservations
  for (let i = 1; i <= 25; i++) {
    // Random Guest Count (2 to 12)
    const guestCount = Math.floor(Math.random() * 11) + 2; 
    
    // Table Logic: 1 table per 4 people
    // 1~4: 1 table, 5~8: 2 tables, 9~12: 3 tables
    const tableCount = Math.ceil(guestCount / 4);
    const tableType = tableTypes[Math.floor(Math.random() * tableTypes.length)];
    
    // Assign Table Number (Simple sequential for demo)
    const tableNumber = `${i}`; // In real app, this would be specific table IDs (1-60)

    // Financials
    const seatFee = 200000 * tableCount;
    const deposit = 20000 * tableCount;
    const totalCost = seatFee + deposit;

    // Car Logic
    const hasCar = Math.random() > 0.1; // 90% bring cars
    const carNumbers: string[] = [];
    if (hasCar) {
      // Register some cars (usually 1 or 2)
      const registeredCount = Math.ceil(guestCount / 4);
      for(let k=0; k<registeredCount; k++) {
        carNumbers.push(randomCar());
      }
    }

    // Force specific test case
    if (i === 1) {
      carNumbers.push('12가3456'); // For testing
    }

    MOCK_RESERVATIONS.push({
      id: `res_${i}`,
      guestName: `김철수${i}`,
      guestCount,
      carNumbers,
      checkInDate: today,
      parkedCarCount: 0,
      contact: `010-1234-${1000 + i}`,
      tableNumber,
      tableType,
      tableCount,
      hasCar,
      seatFee,
      deposit,
      totalCost
    });
  }

  console.log("Simulated Data Initialized:", MOCK_RESERVATIONS.length, "reservations");
};

// Initialize on load
initMockData();

// --- SERVICE FUNCTIONS (MOCK) ---

export const searchReservations = async (carNumberQuery: string): Promise<Reservation[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // In-memory filter
  return MOCK_RESERVATIONS.filter(r => 
    r.carNumbers.some(num => num.includes(carNumberQuery))
  );
};

export const getAllReservations = async (): Promise<Reservation[]> => {
  // Return all for the list view
  return [...MOCK_RESERVATIONS];
};

export const getLogsByReservationId = async (reservationId: string): Promise<ParkingLog[]> => {
    // Return logs for a specific reservation (sorted by time desc)
    return MOCK_LOGS.filter(log => log.reservationId === reservationId)
                    .sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
};

export const admitVehicle = async (
  reservation: Reservation | null, 
  carNumber: string, 
  isPaid: boolean
): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const amount = isPaid ? PARKING_FEE : 0;
  const entryTime = new Date();

  if (reservation) {
    const target = MOCK_RESERVATIONS.find(r => r.id === reservation.id);
    if (target) {
      target.parkedCarCount += 1;
      
      MOCK_LOGS.unshift({
        id: `log_${Date.now()}`,
        reservationId: reservation.id,
        carNumber,
        entryTime,
        isPaid,
        amount,
        handledBy: 'sim_user'
      });
    }
  } else {
    // Walk-in
    MOCK_LOGS.unshift({
      id: `log_${Date.now()}`,
      reservationId: null,
      carNumber,
      entryTime,
      isPaid: true,
      amount: PARKING_FEE,
      handledBy: 'sim_user'
    });
  }
};

export const getDailyStats = async (): Promise<DailyStats> => {
  // Calculate from Mock Data
  let totalRevenue = MOCK_LOGS.reduce((sum, log) => sum + log.amount, 0);
  // Current Parked = Logs (assuming no exits for sim)
  let currentParked = MOCK_LOGS.length; 
  let totalGuests = MOCK_RESERVATIONS.reduce((sum, r) => sum + r.guestCount, 0);

  return {
    totalReservations: MOCK_RESERVATIONS.length,
    totalGuests,
    currentParked,
    totalRevenue
  };
};

export const getRecentLogs = async (): Promise<ParkingLog[]> => {
  return [...MOCK_LOGS];
};