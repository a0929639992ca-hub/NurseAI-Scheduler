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
    let a = 0, e = 0, n = 0, c = 0;
    
    roster.schedules.forEach(s => {
      const shift = s.schedule[dayIndex]?.shift;
      if (!shift) return;

      if ([ShiftType.A, ShiftType.A1].includes(shift)) a++;
      if ([ShiftType.E, ShiftType.E1].includes(shift)) e++;
      if ([ShiftType.N, ShiftType.N1].includes(shift)) n++;
      if ([ShiftType.C, ShiftType.F].includes(shift)) c++; // F covers C
    });

    return { a, e, n, c };
  };

  // Helper to export CSV
  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    
    // Header
    const header = ["姓名", "單位", ...days.map(d => `${d}號`)].join(",");
    csvContent += header + "\r\n";

    // Rows
    roster.schedules.forEach(s => {
      const nurse = getNurseInfo(s.nurseId);
      if (!nurse) return;
      
      const shifts = s.schedule.map(d => d.shift).join(",");
      const row = `${nurse.name},${nurse.unit},${shifts}`;
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
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
      
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-slate-200 border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r w-24 border-b">
                姓名
              </th>
              {days.map(d => (
                <th key={d} className="px-1 py-2 text-center text-xs font-medium text-slate-500 w-10 min-w-[40px] border-r border-b border-slate-100 bg-slate-50">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {roster.schedules.map(schedule => {
              const nurse = getNurseInfo(schedule.nurseId);
              if (!nurse) return null;

              return (
                <tr key={schedule.nurseId} className="hover:bg-slate-50 transition-colors">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 border-r border-slate-200 group-hover:bg-slate-50 border-b">
                    <div className="font-medium text-slate-900 text-sm">{nurse.name}</div>
                    <div className="text-xs text-slate-500">{nurse.unit}</div>
                  </td>
                  {schedule.schedule.map((day, idx) => (
                    <td key={idx} className="p-1 border-r border-b border-slate-100 text-center">
                      <div className={`
                        w-8 h-8 mx-auto flex items-center justify-center rounded text-sm font-bold border
                        ${SHIFT_COLORS[day.shift]}
                      `}>
                        {day.shift}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          {/* Summary Footer */}
          <tfoot className="bg-slate-50 font-semibold text-xs text-slate-700">
             {/* Row for A */}
             <tr>
               <td className="sticky left-0 z-10 bg-slate-100 px-3 py-2 border-r border-t border-slate-300">
                  白班 (A+A1)
               </td>
               {days.map((_, idx) => (
                 <td key={`a-${idx}`} className="text-center py-2 border-r border-t border-slate-200">
                   {getDailyCounts(idx).a}
                 </td>
               ))}
             </tr>
             {/* Row for C */}
             <tr>
               <td className="sticky left-0 z-10 bg-slate-100 px-3 py-2 border-r border-slate-200">
                  C班 (C+F)
               </td>
               {days.map((_, idx) => (
                 <td key={`c-${idx}`} className="text-center py-2 border-r border-slate-200">
                   {getDailyCounts(idx).c}
                 </td>
               ))}
             </tr>
             {/* Row for E */}
             <tr>
               <td className="sticky left-0 z-10 bg-slate-100 px-3 py-2 border-r border-slate-200">
                  小夜 (E+E1)
               </td>
               {days.map((_, idx) => (
                 <td key={`e-${idx}`} className="text-center py-2 border-r border-slate-200">
                   {getDailyCounts(idx).e}
                 </td>
               ))}
             </tr>
             {/* Row for N */}
             <tr>
               <td className="sticky left-0 z-10 bg-slate-100 px-3 py-2 border-r border-slate-200">
                  大夜 (N+N1)
               </td>
               {days.map((_, idx) => (
                 <td key={`n-${idx}`} className="text-center py-2 border-r border-slate-200">
                   {getDailyCounts(idx).n}
                 </td>
               ))}
             </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <div className="flex flex-wrap gap-4">
          {Object.values(ShiftType).map(type => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-4 h-4 rounded border ${SHIFT_COLORS[type]}`}></div>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RosterView;