import React, { useState, useEffect, useCallback } from 'react';
import DashboardStats from './components/DashboardStats';
import Keypad from './components/Keypad';
import ReservationModal from './components/ReservationModal';
import ReservationList from './components/ReservationList';
import { searchReservations, admitVehicle, getDailyStats, getRecentLogs, getAllReservations, getLogsByReservationId } from './services/parkingService';
import { Reservation, DailyStats, ParkingLog } from './types';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');

  // App Data State
  const [inputCode, setInputCode] = useState('');
  const [stats, setStats] = useState<DailyStats>({
    totalReservations: 0,
    totalGuests: 0,
    currentParked: 0,
    totalRevenue: 0
  });
  const [recentLogs, setRecentLogs] = useState<ParkingLog[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foundReservation, setFoundReservation] = useState<Reservation | null>(null);
  const [foundReservationLogs, setFoundReservationLogs] = useState<ParkingLog[]>([]); // New state for modal history
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Constants
  const TOTAL_CAPACITY = 60; 

  // Initial Data Load
  const refreshData = useCallback(async () => {
    const s = await getDailyStats();
    setStats(s);
    const l = await getRecentLogs();
    setRecentLogs(l);
    const r = await getAllReservations();
    setAllReservations(r);
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Handlers
  const handleKeypadPress = (key: string) => {
    if (inputCode.length < 4) {
      setInputCode(prev => prev + key);
    }
  };

  const handleClear = () => setInputCode('');
  const handleBackspace = () => setInputCode(prev => prev.slice(0, -1));

  const handleSearch = async () => {
    if (inputCode.length < 1) return; 

    const results = await searchReservations(inputCode);
    
    if (results.length > 0) {
      const res = results[0];
      setFoundReservation(res);
      // Fetch history for this reservation to check payment status
      const logs = await getLogsByReservationId(res.id);
      setFoundReservationLogs(logs);
    } else {
      setFoundReservation(null);
      setFoundReservationLogs([]);
    }
    
    setIsModalOpen(true);
  };

  const handleConfirmEntry = async (isPaid: boolean) => {
    setIsProcessing(true);
    try {
      await admitVehicle(foundReservation, inputCode, isPaid);
      showToast(`${inputCode} 입차 완료!`);
      setInputCode('');
      setIsModalOpen(false);
      setFoundReservation(null);
      setFoundReservationLogs([]);
      await refreshData();
    } catch (error) {
      alert("처리 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md z-10 shrink-0">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold tracking-tight">🚗 남양계곡가든&남양펜션 주차관리</h1>
          <div className="text-xs font-light opacity-80">{new Date().toLocaleDateString()}</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar w-full max-w-md mx-auto relative">
        {activeTab === 'dashboard' ? (
           <div className="p-4 flex flex-col min-h-full">
              {/* Dashboard View */}
              <DashboardStats stats={stats} totalCapacity={TOTAL_CAPACITY} />

              <div className="flex-1 flex flex-col justify-center mb-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <label className="block text-center text-gray-500 mb-2 font-medium">차량 번호 입력</label>
                  <div 
                    className={`text-4xl font-bold text-center py-4 mb-6 rounded-xl border-2 tracking-[0.5em] h-20 flex items-center justify-center
                      ${inputCode ? 'border-primary text-slate-800 bg-teal-50' : 'border-gray-200 text-gray-300 bg-gray-50'}
                    `}
                  >
                    {inputCode || '0000'}
                  </div>
                  
                  <Keypad 
                    onKeyPress={handleKeypadPress}
                    onClear={handleClear}
                    onBackspace={handleBackspace}
                    onSearch={handleSearch}
                    disabled={isProcessing}
                  />
                  <div className="mt-4 text-center">
                      <p className="text-xs text-gray-400">테스트용 번호: 3456</p>
                  </div>
                </div>
              </div>

              {/* Recent Logs Summary */}
              <div className="mb-24">
                  <h3 className="text-gray-500 font-bold text-sm mb-2 px-1">최근 입차 기록</h3>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                      {recentLogs.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">기록이 없습니다.</div>
                      ) : (
                          recentLogs.slice(0, 3).map(log => (
                              <div key={log.id} className="p-3 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <span className="font-bold text-slate-700">{log.carNumber}</span>
                                      <span className="text-xs text-gray-400">
                                          {log.entryTime instanceof Date ? log.entryTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                                      </span>
                                  </div>
                                  <div>
                                      {log.amount > 0 ? (
                                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                              +{log.amount.toLocaleString()}
                                          </span>
                                      ) : (
                                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                              무료
                                          </span>
                                      )}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
           </div>
        ) : (
          // Reservation List View
          <ReservationList reservations={allReservations} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-lg z-20 h-16 sm:max-w-md sm:mx-auto">
        <div className="flex justify-around items-center h-full pb-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 w-full ${activeTab === 'dashboard' ? 'text-primary' : 'text-gray-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-xs font-medium">주차 처리</span>
          </button>
          
          <div className="w-px h-8 bg-gray-200"></div>

          <button 
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center gap-1 w-full ${activeTab === 'list' ? 'text-primary' : 'text-gray-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">예약자 명단</span>
          </button>
        </div>
      </nav>

      {/* Modals & Overlays */}
      <ReservationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reservation={foundReservation}
        logs={foundReservationLogs}
        scannedCarNumber={inputCode}
        onConfirm={handleConfirmEntry}
        isProcessing={isProcessing}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg font-bold animate-bounce-up z-50 whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;