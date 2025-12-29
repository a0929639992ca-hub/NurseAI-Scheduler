
import { GoogleGenAI, Type } from "@google/genai";
import { Nurse, MonthlyRoster, ShiftType, RequestMap } from '../types';

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export const generateSchedule = async (
  year: number,
  month: number,
  nurses: Nurse[],
  requests: RequestMap = {},
  model: string = 'gemini-3-pro-preview'
): Promise<MonthlyRoster> => {
  
  const daysInMonth = getDaysInMonth(year, month);
  
  // Rule: Create a new GoogleGenAI instance right before making an API call.
  // ALWAYS use the process.env.API_KEY directly as required by guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are an expert Nursing Scheduler AI for a hospital with units 9E and 10E.
    You must generate a roster for ${year}-${month} with ${daysInMonth} days.
    
    Adhere strictly to these Rules:
    
    1. **Shift Codes & Logic**:
       - **A**: Day shift (08-16) in HOME unit.
       - **A1**: Day shift (08-16) in SUPPORT unit (9E supports 10E, 10E supports 9E).
       - **E**: Evening shift (16-00) in HOME unit.
       - **E1**: Evening shift (16-00) in SUPPORT unit.
       - **N**: Night shift (00-08) in HOME unit.
       - **N1**: Night shift (00-08) in SUPPORT unit.
       - **C**: Fixed shift (14-22). Always in 9E. 
       - **F**: Support shift covering C. Always in 9E.
       - **OFF**: Day off.

    2. **Shift Code Assignment Logic**:
       - If Nurse is 9E:
         - Working Day in 9E -> 'A', in 10E -> 'A1'
         - Working Eve in 9E -> 'E', in 10E -> 'E1'
         - Working Night in 9E -> 'N', in 10E -> 'N1'
       - If Nurse is 10E:
         - Working Day in 10E -> 'A', in 9E -> 'A1'
         - Working Eve in 10E -> 'E', in 9E -> 'E1'
         - Working Night in 10E -> 'N', in 9E -> 'N1'

    3. **DAILY STAFFING REQUIREMENTS (CRITICAL)**:
       - **Unit 9E**:
         - **A shift**: 3 people (9E 'A' + 10E 'A1').
         - **N shift**: 2 people.
         - **C/F Coverage (14-22)**: 1 person REQUIRED.
           - Priority 1: Use code 'C'.
           - Priority 2: If primary C staff is OFF, use code 'F'.
         - **E shift**: 2 people (Standard). 
       - **Unit 10E**:
         - **A shift**: 3 people (10E 'A' + 9E 'A1').
         - **E shift**: 2 people.
         - **N shift**: 2 people.

    4. **Legal & Safety Constraints (STRICT)**:
       - **Max Consecutive Days**: STRICTLY MAX 6 days working.
       - **Rest Interval**: Minimum 11 hours between shifts. (No E->A, No N->A, No C->A transitions).
    
    5. **Nurse Preferences**:
       - Respect "OFF" requests in the provided JSON.
  `;

  const prompt = `
    Generate a JSON schedule for Year: ${year}, Month: ${month}.
    Nurses: ${JSON.stringify(nurses.map(n => ({ id: n.id, unit: n.unit, name: n.name, majorShift: n.majorShift })))}
    Mandatory Requests: ${JSON.stringify(requests)}
    Return a strictly valid JSON object.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      schedules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            nurseId: { type: Type.STRING },
            dailyShifts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['nurseId', 'dailyShifts']
        }
      }
    },
    required: ['schedules']
  };

  const response = await ai.models.generateContent({
    model: model, 
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    }
  });

  // Extracting text output from response.text property (not method)
  const result = JSON.parse(response.text);

  const processedSchedules = result.schedules.map((s: any) => {
    const scheduleEntries = s.dailyShifts.map((shiftCode: string, index: number) => {
      const day = index + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let validShift = ShiftType.OFF;
      if (Object.values(ShiftType).includes(shiftCode as ShiftType)) {
        validShift = shiftCode as ShiftType;
      }
      return { date: dateStr, shift: validShift };
    });
    return { nurseId: s.nurseId, schedule: scheduleEntries };
  });

  return { year, month, schedules: processedSchedules };
};
