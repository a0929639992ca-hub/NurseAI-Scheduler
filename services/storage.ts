import { Nurse, Unit, MonthlyRoster, MajorShiftType } from '../types';

const STORAGE_KEYS = {
  NURSES: 'nurseai_nurses',
  ROSTERS: 'nurseai_rosters',
};

// Initial Mock Data - Updated with real data and MajorShiftType.A as default
const INITIAL_NURSES: Nurse[] = [
  { id: '1', employeeId: 'N20169', name: '李道民', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '2', employeeId: 'N16913', name: '陳怡樺', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '3', employeeId: 'N4418', name: '蔡妙美', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '4', employeeId: 'N17696', name: '趙于萱', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '5', employeeId: 'N5707', name: '趙敏雲', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '6', employeeId: 'N30168', name: '蕭伊君', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '7', employeeId: 'N11640', name: '劉泱蘭', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '8', employeeId: '102130', name: '劉燕鈴', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '9', employeeId: '102327', name: '張峻維', unit: Unit.U9E, majorShift: MajorShiftType.A },
  { id: '10', employeeId: 'N6207', name: '曹曉貞', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '11', employeeId: 'N11658', name: '張艾合', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '12', employeeId: 'N16926', name: '李佳靜', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '13', employeeId: 'N21838', name: '劉景明', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '14', employeeId: 'N25710', name: '陳凱雰', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '15', employeeId: 'N25824', name: '陳盈甄', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '16', employeeId: 'N37268', name: '藍聖宗', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '17', employeeId: 'N28413', name: '凃雅慧', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '18', employeeId: 'N38964', name: '羅琬蓉', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '19', employeeId: 'N38992', name: '邱綺萱', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '20', employeeId: 'N86944', name: '林宣萱', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '21', employeeId: '000001', name: '楊子萱', unit: Unit.U10E, majorShift: MajorShiftType.A },
  { id: '22', employeeId: '000002', name: '楊菀婷', unit: Unit.U10E, majorShift: MajorShiftType.A },
];

export const getNurses = (): Nurse[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.NURSES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(INITIAL_NURSES));
    return INITIAL_NURSES;
  }
  return JSON.parse(stored);
};

export const saveNurse = (nurse: Nurse): void => {
  const nurses = getNurses();
  const index = nurses.findIndex(n => n.id === nurse.id);
  if (index >= 0) {
    nurses[index] = nurse;
  } else {
    nurses.push(nurse);
  }
  localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(nurses));
};

export const deleteNurse = (id: string): void => {
  const nurses = getNurses();
  const filtered = nurses.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(filtered));
};

export const getRoster = (year: number, month: number): MonthlyRoster | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.ROSTERS);
  if (!stored) return null;
  const rosters: MonthlyRoster[] = JSON.parse(stored);
  return rosters.find(r => r.year === year && r.month === month) || null;
};

export const saveRoster = (roster: MonthlyRoster): void => {
  const stored = localStorage.getItem(STORAGE_KEYS.ROSTERS);
  let rosters: MonthlyRoster[] = stored ? JSON.parse(stored) : [];
  
  // Remove existing roster for this month if exists
  rosters = rosters.filter(r => !(r.year === roster.year && r.month === roster.month));
  rosters.push(roster);
  
  localStorage.setItem(STORAGE_KEYS.ROSTERS, JSON.stringify(rosters));
};