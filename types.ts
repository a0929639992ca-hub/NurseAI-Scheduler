export enum Unit {
  U9E = '9E',
  U10E = '10E'
}

export enum MajorShiftType {
  A = 'A',   // Day
  E = 'E',   // Evening
  N = 'N',   // Night
  C = 'C',   // Fixed C
  F = 'F'    // Fixed F
}

export interface Nurse {
  id: string;
  name: string;
  unit: Unit;
  employeeId: string;
  majorShift: MajorShiftType;
}

export enum ShiftType {
  A = 'A',   // 08-16 Home
  A1 = 'A1', // 08-16 Support
  E = 'E',   // 16-00 Home
  E1 = 'E1', // 16-00 Support
  N = 'N',   // 00-08 Home
  N1 = 'N1', // 00-08 Support
  C = 'C',   // 14-22 (Fixed 9E)
  F = 'F',   // Support (Fixed 9E)
  OFF = 'OFF'
}

export interface DailySchedule {
  date: string; // YYYY-MM-DD
  shift: ShiftType;
}

export interface NurseSchedule {
  nurseId: string;
  schedule: DailySchedule[];
}

export interface MonthlyRoster {
  year: number;
  month: number;
  schedules: NurseSchedule[];
}

// Map of NurseID -> Day (1-31) -> ShiftType
export type RequestMap = Record<string, Record<number, ShiftType>>;

export interface GenerationConfig {
  year: number;
  month: number;
  nurses: Nurse[];
  requests?: RequestMap;
}