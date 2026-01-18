import React, { useState, useMemo } from 'react';
import { Reservation } from '../types';
import { FREE_PARKING_RATIO } from '../services/parkingService';

interface ReservationListProps {
  reservations: Reservation[];
}

const ReservationList: React.FC<ReservationListProps> = ({ reservations }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm) return reservations;
    return reservations.filter(r => 
      r.guestName.includes(searchTerm) || 
      r.carNumbers.some(c => c.includes(searchTerm)) ||
      r.contact?.includes(searchTerm)
    );
  }, [reservations, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Search Bar */}
      <div className="p-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="relative">
          <input 
            type="text" 
            placeholder="예약자명, 차량번호, 전화번호 검색"
            className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl text-gray-700 focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            검색 결과가 없습니다.
          </div>
        ) : (
          filtered.map(res => (
            <div key={res.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
               {/* Left accent bar based on table type */}
               <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                 ${res.tableType === '애견' ? 'bg-orange-400' : res.tableType === '단체' ? 'bg-purple-500' : 'bg-primary'}`} 
               />
               
               <div className="pl-3">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                       {res.guestName}
                       <span className={`text-[10px] px-2 py-0.5 rounded-full text-white
                         ${res.tableType === '애견' ? 'bg-orange-400' : res.tableType === '단체' ? 'bg-purple-500' : 'bg-primary'}
                       `}>
                         {res.tableType}
                       </span>
                     </h3>
                     <p className="text-sm text-gray-500">{res.contact}</p>
                   </div>
                   <div className="text-right">
                     <div className="text-xl font-bold text-slate-700">{res.tableNumber}번</div>
                     <div className="text-xs text-gray-400">테이블</div>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg">
                    <div>
                        <span className="text-xs text-gray-400 block">인원/테이블</span>
                        {res.guestCount}명 / {res.tableCount}개
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block">무료주차</span>
                        {Math.ceil(res.guestCount / FREE_PARKING_RATIO)}대 가능
                    </div>
                 </div>

                 {/* Car Numbers */}
                 <div>
                   <span className="text-xs text-gray-400 block mb-1">등록 차량 ({res.carNumbers.length})</span>
                   <div className="flex flex-wrap gap-2">
                     {res.carNumbers.length > 0 ? res.carNumbers.map((car, idx) => (
                       <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-semibold">
                         {car}
                       </span>
                     )) : (
                       <span className="text-gray-300 text-xs italic">등록된 차량 없음</span>
                     )}
                   </div>
                 </div>

               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReservationList;