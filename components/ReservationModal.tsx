import React, { useMemo } from 'react';
import { Reservation, ParkingLog } from '../types';
import { PARKING_FEE, FREE_PARKING_RATIO } from '../services/parkingService';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  logs: ParkingLog[]; // History of entered cars for this reservation
  scannedCarNumber: string;
  onConfirm: (isPaid: boolean) => void;
  isProcessing: boolean;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
  logs,
  scannedCarNumber,
  onConfirm,
  isProcessing
}) => {
  if (!isOpen) return null;

  // Check if this car is already in logs
  const existingEntry = useMemo(() => {
    return logs.find(log => log.carNumber === scannedCarNumber);
  }, [logs, scannedCarNumber]);

  // Decision Logic
  const decision = useMemo(() => {
    if (!reservation) {
      // Walk-in case
      return {
        type: 'WALK_IN',
        allowed: 0,
        current: 0,
        needsPayment: true,
        message: '미예약 차량 (일반 입차)',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800'
      };
    }

    const allowed = Math.ceil(reservation.guestCount / FREE_PARKING_RATIO);
    const current = reservation.parkedCarCount;
    const isFree = current < allowed;

    if (isFree) {
      return {
        type: 'FREE',
        allowed,
        current,
        needsPayment: false,
        message: '무료 입차 가능',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800'
      };
    } else {
      return {
        type: 'PAID',
        allowed,
        current,
        needsPayment: true,
        message: '무료 한도 초과 (요금 부과)',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-800'
      };
    }
  }, [reservation]);

  // Format currency
  const fmt = (num: number) => num.toLocaleString();
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="text-lg font-bold">입차 승인 처리</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Car Number Badge */}
          <div className="flex justify-center mb-6">
            <div className={`px-6 py-2 rounded-lg border flex flex-col items-center ${existingEntry ? 'bg-yellow-50 border-yellow-300' : 'bg-slate-100 border-slate-300'}`}>
              <span className={`text-sm block text-center mb-1 ${existingEntry ? 'text-yellow-700 font-bold' : 'text-gray-500'}`}>
                 {existingEntry ? '⚠️ 이미 입차된 차량입니다' : '입차 차량'}
              </span>
              <span className="text-3xl font-mono font-bold tracking-widest text-slate-800">
                {scannedCarNumber || "----"}
              </span>
            </div>
          </div>

          {reservation ? (
            <div className="space-y-4">
              
              {/* Customer Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-start mb-2 border-b border-slate-200 pb-2">
                    <div>
                        <span className="text-xs text-slate-500 block">예약자명</span>
                        <span className="text-lg font-bold text-slate-800">{reservation.guestName}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-semibold text-slate-700">{reservation.contact}</span>
                    </div>
                </div>
                <div className="flex justify-between text-sm">
                   <span>{reservation.tableType} {reservation.tableNumber}번 테이블</span>
                   <span className="font-bold">{reservation.guestCount}명 ({reservation.tableCount}석)</span>
                </div>
              </div>

              {/* Entry History (NEW) */}
              {logs.length > 0 && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-500 border-b border-gray-200 flex justify-between">
                        <span>현재 입차된 차량 ({logs.length}대)</span>
                        <span>유료 {logs.filter(l => l.isPaid).length}대</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
                        {logs.map((log) => (
                            <div key={log.id} className="px-3 py-2 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-700">{log.carNumber}</span>
                                    {log.carNumber === scannedCarNumber && (
                                        <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1 rounded">현재차량</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs">{formatTime(log.entryTime)}</span>
                                    {log.isPaid ? (
                                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                            유료
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                            무료
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* Parking Decision Box */}
              <div className={`border-2 rounded-xl p-4 text-center ${decision.border} ${decision.bg}`}>
                <h4 className={`text-xl font-bold mb-1 ${decision.text}`}>
                  {decision.message}
                </h4>
                <div className="text-sm opacity-80 font-medium">
                  현재 {decision.current}대 / 무료허용 {decision.allowed}대
                </div>
              </div>
            </div>
          ) : (
             // No Reservation Found
             <div className="text-center py-4">
                <p className="text-gray-600 font-medium">예약 정보를 찾을 수 없습니다.</p>
                <p className="text-sm text-gray-400 mt-1">방문객(Walk-in)으로 처리하시겠습니까?</p>
             </div>
          )}

          {/* Payment Amount Display */}
          {decision.needsPayment && (
             <div className="mt-4 flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-100">
                <span className="text-red-700 font-bold">주차 결제금액</span>
                <span className="text-2xl font-extrabold text-red-600">{fmt(PARKING_FEE)}원</span>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-1 gap-3 shrink-0">
            {decision.needsPayment ? (
                 <button 
                 onClick={() => onConfirm(true)}
                 disabled={isProcessing}
                 className="w-full py-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-lg font-bold shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
               >
                 {isProcessing ? '처리중...' : existingEntry ? '재입차 확인 (결제됨)' : '현장 결제 확인 및 입차'}
               </button>
            ) : (
                <button 
                onClick={() => onConfirm(false)}
                disabled={isProcessing}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-lg font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
               >
                {isProcessing ? '처리중...' : existingEntry ? '재입차 승인' : '무료 입차 승인'}
               </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;