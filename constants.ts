import { ShiftType } from './types';

export const SHIFT_COLORS: Record<ShiftType, string> = {
  [ShiftType.A]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ShiftType.A1]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ShiftType.E]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ShiftType.E1]: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  [ShiftType.N]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ShiftType.N1]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [ShiftType.C]: 'bg-pink-100 text-pink-800 border-pink-200',
  [ShiftType.F]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [ShiftType.OFF]: 'bg-gray-100 text-gray-400 border-gray-200',
};

export const SHIFT_DESCRIPTIONS: Record<ShiftType, string> = {
  [ShiftType.A]: '白班 (本單位) 08-16',
  [ShiftType.A1]: '白班 (支援) 08-16',
  [ShiftType.E]: '小夜 (本單位) 16-00',
  [ShiftType.E1]: '小夜 (支援) 16-00',
  [ShiftType.N]: '大夜 (本單位) 00-08',
  [ShiftType.N1]: '大夜 (支援) 00-08',
  [ShiftType.C]: 'C班 (9E固定) 14-22',
  [ShiftType.F]: 'F班 (支援) 9E',
  [ShiftType.OFF]: '休假',
};
