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

  // Helper to find nurse info and MAINTAIN THE NURSES ARRAY ORDER
  // The roster schedules might be in any order, so we map the nurses array instead
  const sortedSchedules = nurses.map(nurse => {
    return roster.schedules.find(s => s.nurseId === nurse.id);
  }).filter(Boolean) as any[];

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

  const getPersonalOffCount = (schedule: { shift: ShiftType }[]) => {
    return schedule.filter(d => d.shift === ShiftType.OFF).length;
  };

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    const header = ["姓名", "單位", ...days.map(d => `${d}號`), "休假總計"].join(",");
    csvContent += header + "\r\n";

    sortedSchedules.forEach(s => {
      const nurse = nurses.find(n => n.id === s.nurseId);
      if (!nurse) return;
      const shifts = s.schedule.map((d: any) => d.shift).join(",");
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
      <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
        <h3 className="text-md font-bold text-slate-800">
          {roster.year}年 {roster.month}月 排班結果
        </h3>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-white rounded hover:bg-slate-600 text-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          匯出 CSV
        </button>
      </div>
      
      <div className="overflow-auto flex-1 relative">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 top-0 z-40 bg-slate-100 px-2 py-2 text-left text-[10px] font-bold text-slate-600 border-r border-b border-slate-300 min-w-[100px] whitespace-nowrap">
                姓名 / 單位
              </th>
              {days.map(d => (
                <th key={d} className="bg-slate-100 px-0 py-2 text-center text-[10px] font-bold text-slate-600 min-w-[28px] border-r border-b border-slate-300">
                  {d}
                </th>
              ))}
              <th className="sticky right-0 top-0 z-30 bg-blue-100 px-1 py-2 text-center text-[10px] font-bold text-blue-700 border-b border-slate-300 min-w-[50px] shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                休假
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedSchedules.map(schedule => {
              const nurse = nurses.find(n => n.id === schedule.nurseId);
              if (!nurse) return null;

              return (
                <tr key={schedule.nurseId} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-50 px-2 py-1.5 border-r border-b border-slate-200 whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="font-bold text-slate-900 text-xs">{nurse.name}</div>
                    <div className="text-[9px] text-slate-500 leading-none">{nurse.unit}·{nurse.majorShift}</div>
                  </td>
                  {schedule.schedule.map((day: any, idx: number) => (
                    <td key={idx} className="p-0.5 border-r border-b border-slate-100 text-center">
                      <div className={`
                        w-6 h-6 mx-auto flex items-center justify-center rounded text-[10px] font-bold border
                        ${SHIFT_COLORS[day.shift]}
                      `}>
                        {day.shift}
                      </div>
                    </td>
                  ))}
                  <td className="sticky right-0 z-20 bg-blue-50/30 group-hover:bg-blue-50 p-1 border-b border-slate-200 text-center font-bold text-[11px] text-blue-700 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                    {getPersonalOffCount(schedule.schedule)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 z-30 bg-slate-50 font-bold text-[10px] text-slate-700">
             <tr className="bg-slate-50">
               <td className="sticky left-0 z-40 bg-slate-100 px-2 py-1.5 border-r border-t border-slate-300 whitespace-nowrap">
                  白班 (A+A1)
               </td>
               {days.map((_, idx) => (
                 <td key={`a-${idx}`} className="text-center py-1 border-r border-t border-slate-200">
                   {getDailyCounts(idx).a}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-100 border-t border-slate-300"></td>
             </tr>
             <tr className="bg-slate-50">
               <td className="sticky left-0 z-40 bg-slate-100 px-2 py-1.5 border-r border-slate-200 whitespace-nowrap">
                  小夜 (E+E1)
               </td>
               {days.map((_, idx) => (
                 <td key={`e-${idx}`} className="text-center py-1 border-r border-slate-200">
                   {getDailyCounts(idx).e}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-100"></td>
             </tr>
             <tr className="bg-slate-50">
               <td className="sticky left-0 z-40 bg-slate-100 px-2 py-1.5 border-r border-slate-200 whitespace-nowrap">
                  大夜 (N+N1)
               </td>
               {days.map((_, idx) => (
                 <td key={`n-${idx}`} className="text-center py-1 border-r border-slate-200">
                   {getDailyCounts(idx).n}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-100"></td>
             </tr>
             <tr className="bg-white text-slate-500 italic">
               <td className="sticky left-0 z-40 bg-slate-50 px-2 py-1.5 border-r border-t border-slate-300 whitespace-nowrap">
                  每日休假
               </td>
               {days.map((_, idx) => (
                 <td key={`off-${idx}`} className="text-center py-1 border-r border-t border-slate-200">
                   {getDailyCounts(idx).off}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-50 border-t border-slate-300"></td>
             </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default RosterView;