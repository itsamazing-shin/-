import React from 'react';
import { DailyStats } from '../types';

interface DashboardStatsProps {
  stats: DailyStats;
  totalCapacity: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, totalCapacity }) => {
  const occupancyRate = Math.min(100, Math.round((stats.currentParked / totalCapacity) * 100));
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-gray-500 text-sm font-semibold">주차 현황</h2>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800">{stats.currentParked}</span>
            <span className="text-gray-400 font-medium">/ {totalCapacity}대</span>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-gray-500 text-sm font-semibold">금일 매출</h2>
            <span className="text-xl font-bold text-primary">
                {stats.totalRevenue.toLocaleString()}원
            </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${occupancyRate > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${occupancyRate}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div>예약 {stats.totalReservations}팀 ({stats.totalGuests}명)</div>
        <div>잔여 {totalCapacity - stats.currentParked}면</div>
      </div>
    </div>
  );
};

export default DashboardStats;