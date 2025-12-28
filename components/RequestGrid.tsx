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
    // Toggle between OFF and undefined (Available)
    // Future expansion: could cycle through Fixed Day/Fixed Night etc.
    if (current === ShiftType.OFF) {
      onChange(nurseId, day, undefined);
    } else {
      onChange(nurseId, day, ShiftType.OFF);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full border border-yellow-200">
      <div className="p-4 border-b border-yellow-200 bg-yellow-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-yellow-800">
            {year}年 {month}月 預假/指定班別
          </h3>
          <p className="text-xs text-yellow-600 mt-1">
            點擊格子設定「OFF」(預假)。AI 排班時將強制遵守這些設定。
          </p>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-slate-200 border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r w-24">
                姓名 (大班)
              </th>
              {days.map(d => (
                <th key={d} className="px-1 py-2 text-center text-xs font-medium text-slate-500 w-10 min-w-[40px] border-r border-slate-100">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {nurses.map(nurse => (
              <tr key={nurse.id} className="hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 border-r border-slate-200 group-hover:bg-slate-50">
                  <div className="font-medium text-slate-900 text-sm">{nurse.name}</div>
                  <div className="text-xs text-slate-500">{nurse.unit} / {nurse.majorShift}</div>
                </td>
                {days.map(day => {
                  const shift = requests[nurse.id]?.[day];
                  return (
                    <td 
                      key={day} 
                      onClick={() => toggleRequest(nurse.id, day)}
                      className={`
                        p-1 border-r border-slate-100 text-center cursor-pointer hover:bg-slate-100 transition-colors
                        ${shift === ShiftType.OFF ? 'bg-gray-200' : ''}
                      `}
                    >
                      {shift ? (
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded text-xs font-bold text-gray-500">
                          {shift}
                        </div>
                      ) : (
                        <div className="w-full h-8"></div>
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
