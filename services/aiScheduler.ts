import { GoogleGenAI, Type } from "@google/genai";
import { Nurse, MonthlyRoster, ShiftType, RequestMap } from '../types';

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export const generateSchedule = async (
  year: number,
  month: number,
  nurses: Nurse[],
  requests: RequestMap = {},
  model: string = 'gemini-3-flash-preview' // Default to Flash for better quotas
): Promise<MonthlyRoster> => {
  
  // Handle Google AI Studio Environment (IDX/Project IDX)
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
       await (window as any).aistudio.openSelectKey();
    }
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("未偵測到 API Key。請確認環境變數 process.env.API_KEY 已設定。");
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
           - Priority 3: If 'F' is not possible, add +1 to E shift (Total E becomes 3).
         - **E shift**: 2 people (Standard). 
           - *Exception*: If C/F is not covered, E shift must be 3 people.
       - **Unit 10E**:
         - **A shift**: 3 people (10E 'A' + 9E 'A1').
         - **E shift**: 2 people.
         - **N shift**: 2 people.

    4. **Legal & Safety Constraints (STRICT)**:
       - **Max Consecutive Days**: STRICTLY MAX 6 days working. The 7th day MUST be 'OFF'.
       - **Avoid 6 Days**: Try to keep consecutive working days to 5 or fewer unless absolutely necessary.
       - **Rest Interval**: Minimum 11 hours between shifts.
         - FORBIDDEN: E/E1 -> A/A1 (Next Day)
         - FORBIDDEN: N/N1 -> A/A1/E/E1 (Same Day or Next Day without gap)
         - FORBIDDEN: C/F -> A/A1 (Next Day)
    
    5. **Nurse Preferences**:
       - **Major Shift**: If a nurse has a major shift assigned (e.g. 'N'), try to maximize that shift type.
       - **Requests**: If a specific day is requested as 'OFF', you MUST respect it.

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
      model: model, 
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

  } catch (error: any) {
    console.error("AI Scheduling Failed:", error);
    
    // Provide more specific error messages
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(`API 額度已滿 (Quota Exceeded)。目前的模型 (${model}) 可能已達到免費限制。請在「系統設定」中切換至其他模型 (如 Flash) 後再試。`);
    }

    throw error;
  }
};
