import React from 'react';
import { MonthlyRoster, Nurse, ShiftType } from '../types';
import { SHIFT_COLORS } from '../constants';
import { Download } from 'lucide-react';

interface RosterViewProps {
  roster: MonthlyRoster;
  nurses: Nurse[];
}

const RosterView: React.FC<RosterViewProps> = ({ roster, nurses }) => {
  const daysInMonth = new Date(roster.year, roster.month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper to find nurse name
  const getNurseInfo = (id: string) => nurses.find(n => n.id === id);

  // Helper to calculate daily totals
  const getDailyCounts = (dayIndex: number) => {
    let a = 0, e = 0, n = 0, c = 0, off = 0;
    
    roster.schedules.forEach(s => {
      const shift = s.schedule[dayIndex]?.shift;
      if (!shift) return;

      if ([ShiftType.A, ShiftType.A1].includes(shift)) a++;
      if ([ShiftType.E, ShiftType.E1].includes(shift)) e++;
      if ([ShiftType.N, ShiftType.N1].includes(shift)) n++;
      if ([ShiftType.C, ShiftType.F].includes(shift)) c++;
      if (shift === ShiftType.OFF) off++;
    });

    return { a, e, n, c, off };
  };

  // Helper to calculate personal total OFF
  const getPersonalOffCount = (schedule: { shift: ShiftType }[]) => {
    return schedule.filter(d => d.shift === ShiftType.OFF).length;
  };

  // Helper to export CSV
  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    
    // Header
    const header = ["姓名", "單位", ...days.map(d => `${d}號`), "休假總計"].join(",");
    csvContent += header + "\r\n";

    // Rows
    roster.schedules.forEach(s => {
      const nurse = getNurseInfo(s.nurseId);
      if (!nurse) return;
      
      const shifts = s.schedule.map(d => d.shift).join(",");
      const offTotal = getPersonalOffCount(s.schedule);
      const row = `${nurse.name},${nurse.unit},${shifts},${offTotal}`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `排班表_${roster.year}_${roster.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
        <h3 className="text-lg font-bold text-slate-800">
          {roster.year}年 {roster.month}月 排班表
        </h3>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-white rounded hover:bg-slate-600 text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          匯出 CSV
        </button>
      </div>
      
      <div className="overflow-auto flex-1 relative">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 top-0 z-40 bg-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-b border-slate-300 min-w-[120px] whitespace-nowrap">
                姓名 / 單位
              </th>
              {days.map(d => (
                <th key={d} className="bg-slate-100 px-1 py-3 text-center text-xs font-bold text-slate-600 w-10 min-w-[40px] border-r border-b border-slate-300">
                  {d}
                </th>
              ))}
              <th className="sticky right-0 top-0 z-30 bg-blue-100 px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-slate-300 w-20 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                休假總計
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {roster.schedules.map(schedule => {
              const nurse = getNurseInfo(schedule.nurseId);
              if (!nurse) return null;

              return (
                <tr key={schedule.nurseId} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-50 px-4 py-2 border-r border-b border-slate-200 whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="font-bold text-slate-900 text-sm">{nurse.name}</div>
                    <div className="text-[10px] text-slate-500">{nurse.unit} · {nurse.majorShift}</div>
                  </td>
                  {schedule.schedule.map((day, idx) => (
                    <td key={idx} className="p-1 border-r border-b border-slate-100 text-center">
                      <div className={`
                        w-8 h-8 mx-auto flex items-center justify-center rounded text-xs font-bold border
                        ${SHIFT_COLORS[day.shift]}
                      `}>
                        {day.shift}
                      </div>
                    </td>
                  ))}
                  <td className="sticky right-0 z-20 bg-blue-50/30 group-hover:bg-blue-50 p-1 border-b border-slate-200 text-center font-bold text-blue-700 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                    {getPersonalOffCount(schedule.schedule)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Summary Footer */}
          <tfoot className="sticky bottom-0 z-30 bg-slate-50 font-bold text-xs text-slate-700">
             {/* Row for A */}
             <tr className="bg-slate-50">
               <td className="sticky left-0 z-40 bg-slate-100 px-4 py-2 border-r border-t border-slate-300 whitespace-nowrap">
                  白班 (A+A1)
               </td>
               {days.map((_, idx) => (
                 <td key={`a-${idx}`} className="text-center py-2 border-r border-t border-slate-200">
                   {getDailyCounts(idx).a}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-100 border-t border-slate-300"></td>
             </tr>
             {/* Row for C */}
             <tr className="bg-slate-50">
               <td className="sticky left-0 z-40 bg-slate-100 px-4 py-2 border-r border-slate-200 whitespace-nowrap">
                  C班 (C+F)
               </td>
               {days.map((_, idx) => (
                 <td key={`c-${idx}`} className="text-center py-2 border-r border-slate-200">
                   {getDailyCounts(idx).c}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-100"></td>
             </tr>
             {/* Row for E */}
             <tr className="bg-slate-50">
               <td className="sticky left-0 z-40 bg-slate-100 px-4 py-2 border-r border-slate-200 whitespace-nowrap">
                  小夜 (E+E1)
               </td>
               {days.map((_, idx) => (
                 <td key={`e-${idx}`} className="text-center py-2 border-r border-slate-200">
                   {getDailyCounts(idx).e}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-100"></td>
             </tr>
             {/* Row for N */}
             <tr className="bg-slate-50">
               <td className="sticky left-0 z-40 bg-slate-100 px-4 py-2 border-r border-slate-200 whitespace-nowrap">
                  大夜 (N+N1)
               </td>
               {days.map((_, idx) => (
                 <td key={`n-${idx}`} className="text-center py-2 border-r border-slate-200">
                   {getDailyCounts(idx).n}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-100"></td>
             </tr>
             {/* Row for OFF Total Daily */}
             <tr className="bg-white text-slate-500 italic">
               <td className="sticky left-0 z-40 bg-slate-50 px-4 py-2 border-r border-t border-slate-300 whitespace-nowrap">
                  每日休假人數
               </td>
               {days.map((_, idx) => (
                 <td key={`off-${idx}`} className="text-center py-2 border-r border-t border-slate-200">
                   {getDailyCounts(idx).off}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-50 border-t border-slate-300"></td>
             </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 shrink-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.values(ShiftType).map(type => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded border ${SHIFT_COLORS[type]}`}></div>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RosterView;