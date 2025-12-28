import { GoogleGenAI, Type } from "@google/genai";
import { Nurse, MonthlyRoster, ShiftType, RequestMap } from '../types';

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export const generateSchedule = async (
  year: number,
  month: number,
  nurses: Nurse[],
  requests: RequestMap = {}
): Promise<MonthlyRoster> => {
  
  // Handle API Key selection in browser environment
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
       await (window as any).aistudio.openSelectKey();
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("請先設定 API Key 才能使用 AI 排班功能。");
  }

  const daysInMonth = getDaysInMonth(year, month);
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
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
       - **C**: Fixed shift (14-22). Always in 9E. (Even 10E staff work 9E for C shift, but code remains C).
       - **F**: Support shift. Always in 9E.
       - **OFF**: Day off.

    2. **Shift Code Assignment Logic**:
       - If Nurse is 9E:
         - Working Day in 9E -> 'A'
         - Working Day in 10E -> 'A1'
         - Working Eve in 9E -> 'E'
         - Working Eve in 10E -> 'E1'
         - Working Night in 9E -> 'N'
         - Working Night in 10E -> 'N1'
       - If Nurse is 10E:
         - Working Day in 10E -> 'A'
         - Working Day in 9E -> 'A1'
         - Working Eve in 10E -> 'E'
         - Working Eve in 9E -> 'E1'
         - Working Night in 10E -> 'N'
         - Working Night in 9E -> 'N1'

    3. **DAILY STAFFING REQUIREMENTS (CRITICAL)**:
       - **Unit 9E**:
         - A shift (Day): 3 people
         - E shift (Evening): 2 people
         - N shift (Night): 2 people
         - C shift: 1 person
       - **Unit 10E**:
         - A shift (Day): 3 people
         - E shift (Evening): 2 people
         - N shift (Night): 2 people
       
       *Note on Counting*: 
       - 9E staff working 'A' counts towards 9E's A-shift. 
       - 10E staff working 'A1' (support at 9E) counts towards 9E's A-shift.
       - Conversely, 9E staff working 'A1' (support at 10E) counts towards 10E's A-shift.
       - Ensure these exact numbers are met every single day.

    4. **Legal & Safety Constraints**:
       - **Labor Law**: Max 6 consecutive working days (must have OFF after 6 days).
       - **Rest Interval**: Minimum 11 hours between shifts.
         - FORBIDDEN: E/E1 -> A/A1 (Next Day)
         - FORBIDDEN: N/N1 -> A/A1/E/E1 (Same Day or Next Day without gap)
         - FORBIDDEN: C -> A/A1 (Next Day)
    
    5. **Nurse Preferences**:
       - **Major Shift**: If a nurse has a major shift assigned (e.g. 'N'), try to maximize that shift type for them, unless required to fill gaps or strictly forbidden by law.
       - **Requests**: If a specific day is requested as 'OFF' in the input, you MUST respect it.

    6. **Fairness**:
       - Distribute OFF days and unpleasant shifts fairly.
  `;

  const prompt = `
    Generate a JSON schedule for Year: ${year}, Month: ${month}.
    Days in month: ${daysInMonth}.
    
    Nurses:
    ${JSON.stringify(nurses.map(n => ({ 
      id: n.id, 
      unit: n.unit, 
      name: n.name, 
      majorShift: n.majorShift 
    })))}

    Mandatory Requests (Fixed Shifts):
    ${JSON.stringify(requests)}
    *Format: { "nurseId": { "day": "SHIFT_CODE" } }
    
    Return a strictly valid JSON object.
  `;

  // Define the schema for structured output
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
              items: {
                type: Type.STRING, // Values: A, A1, E, E1, N, N1, C, F, OFF
              }
            }
          },
          required: ['nurseId', 'dailyShifts']
        }
      }
    },
    required: ['schedules']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    const result = JSON.parse(response.text);

    // Post-process to ensure data shape matches our internal types
    const processedSchedules = result.schedules.map((s: any) => {
      const scheduleEntries = s.dailyShifts.map((shiftCode: string, index: number) => {
        const day = index + 1;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Basic validation to map string to Enum, fallback to OFF if AI hallucinates
        let validShift = ShiftType.OFF;
        if (Object.values(ShiftType).includes(shiftCode as ShiftType)) {
          validShift = shiftCode as ShiftType;
        }

        return {
          date: dateStr,
          shift: validShift
        };
      });

      return {
        nurseId: s.nurseId,
        schedule: scheduleEntries
      };
    });

    return {
      year,
      month,
      schedules: processedSchedules
    };

  } catch (error) {
    console.error("AI Scheduling Failed:", error);
    // Handle the specific key error gracefully if possible, or rethrow
    if ((error as any).toString().includes("API Key")) {
        throw new Error("API Key 未設定或無效，請重新整理頁面並選擇 Key。");
    }
    throw new Error("Failed to generate schedule. Please try again.");
  }
};