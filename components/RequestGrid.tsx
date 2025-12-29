import React from 'react';
import { Nurse, RequestMap, ShiftType } from '../types';

interface RequestGridProps {
  year: number;
  month: number;
  nurses: Nurse[];
  requests: RequestMap;
  onChange: (nurseId: string, day: number, shift: ShiftType | undefined) => void;
}

const RequestGrid: React.FC<RequestGridProps> = ({ year, month, nurses, requests, onChange }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const toggleRequest = (nurseId: string, day: number) => {
    const current = requests[nurseId]?.[day];
    if (current === ShiftType.OFF) {
      onChange(nurseId, day, undefined);
    } else {
      onChange(nurseId, day, ShiftType.OFF);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full border border-yellow-200">
      <div className="p-3 border-b border-yellow-200 bg-yellow-50 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-md font-bold text-yellow-800">
            {year}年 {month}月 預假設定
          </h3>
          <p className="text-[10px] text-yellow-600 mt-0.5 font-medium">
            點擊格子設定「OFF」。系統將遵循此順序進行排班。
          </p>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 relative">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 top-0 z-40 bg-slate-100 px-2 py-2 text-left text-[10px] font-bold text-slate-600 border-r border-b border-slate-300 min-w-[100px] whitespace-nowrap">
                姓名 (大班)
              </th>
              {days.map(d => (
                <th key={d} className="bg-slate-100 px-0 py-2 text-center text-[10px] font-bold text-slate-600 min-w-[28px] border-r border-b border-slate-300">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {nurses.map(nurse => (
              <tr key={nurse.id} className="hover:bg-yellow-50/50 transition-colors group">
                <td className="sticky left-0 z-20 bg-white group-hover:bg-yellow-50 px-2 py-1.5 border-r border-b border-slate-200 whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <div className="font-bold text-slate-900 text-xs">{nurse.name}</div>
                  <div className="text-[9px] text-slate-500 leading-none">{nurse.unit}·{nurse.majorShift}</div>
                </td>
                {days.map(day => {
                  const shift = requests[nurse.id]?.[day];
                  return (
                    <td 
                      key={day} 
                      onClick={() => toggleRequest(nurse.id, day)}
                      className={`
                        p-0.5 border-r border-b border-slate-100 text-center cursor-pointer hover:bg-yellow-100 transition-colors
                        ${shift === ShiftType.OFF ? 'bg-slate-200' : ''}
                      `}
                    >
                      {shift ? (
                        <div className="w-6 h-6 mx-auto flex items-center justify-center rounded text-[10px] font-black text-slate-600">
                          {shift}
                        </div>
                      ) : (
                        <div className="w-full h-6"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestGrid;