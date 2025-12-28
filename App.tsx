import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, Sparkles, AlertCircle, Menu, X, Undo2, Key, Save } from 'lucide-react';
import NurseManager from './components/NurseManager';
import RosterView from './components/RosterView';
import RequestGrid from './components/RequestGrid';
import { getNurses, getRoster, saveRoster } from './services/storage';
import { generateSchedule } from './services/aiScheduler';
import { MonthlyRoster, RequestMap, ShiftType } from './types';

enum View {
  ROSTER = 'roster',
  STAFF = 'staff',
  SETTINGS = 'settings'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ROSTER);
  const [currentDate, setCurrentDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [activeRoster, setActiveRoster] = useState<MonthlyRoster | null>(null);
  const [requests, setRequests] = useState<RequestMap>({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Settings State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKeyObfuscated, setSavedKeyObfuscated] = useState('');

  useEffect(() => {
    // Load roster when date changes
    const stored = getRoster(currentDate.year, currentDate.month);
    setActiveRoster(stored);
    // Reset requests when changing month (or could persist them if needed)
    setRequests({});
  }, [currentDate]);

  useEffect(() => {
    // Load existing key for display
    const storedKey = localStorage.getItem('nurseai_api_key');
    if (storedKey) {
      setApiKeyInput(storedKey);
      setSavedKeyObfuscated(storedKey.slice(0, 4) + '...' + storedKey.slice(-4));
    }
  }, []);

  const handleRequestChange = (nurseId: string, day: number, shift: ShiftType | undefined) => {
    setRequests(prev => {
      const nurseRequests = { ...prev[nurseId] };
      if (shift === undefined) {
        delete nurseRequests[day];
      } else {
        nurseRequests[day] = shift;
      }
      return {
        ...prev,
        [nurseId]: nurseRequests
      };
    });
  };

  const handleGenerate = async () => {
    const nurses = getNurses();
    if (nurses.length === 0) {
      setError("請先至人員管理新增護理師資料。");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const newRoster = await generateSchedule(currentDate.year, currentDate.month, nurses, requests);
      saveRoster(newRoster);
      setActiveRoster(newRoster);
    } catch (err: any) {
      setError(err.message || "排班失敗");
      // If error suggests auth, switch to settings
      if (err.message && (err.message.includes("API Key") || err.message.includes("key"))) {
         if (confirm("AI 排班需要 API Key。是否前往設定頁面輸入？")) {
           setCurrentView(View.SETTINGS);
         }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearRoster = () => {
    if (confirm('確定要重新排班嗎？目前的排班表將被清除，並回到預假設定畫面。')) {
      setActiveRoster(null);
    }
  };

  const saveApiKey = () => {
    if (!apiKeyInput.trim()) {
      localStorage.removeItem('nurseai_api_key');
      setSavedKeyObfuscated('');
      alert("API Key 已清除");
    } else {
      localStorage.setItem('nurseai_api_key', apiKeyInput.trim());
      setSavedKeyObfuscated(apiKeyInput.trim().slice(0, 4) + '...' + apiKeyInput.trim().slice(-4));
      alert("API Key 已儲存 (僅儲存於您的瀏覽器)");
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-primary/10 text-primary font-bold' 
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white z-50 px-4 py-3 shadow-sm flex justify-between items-center">
        <h1 className="font-bold text-xl text-primary flex items-center gap-2">
           <Sparkles className="w-5 h-5" /> NurseAI
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2 mb-8">
            <Sparkles className="w-6 h-6" />
            NurseAI
          </h1>
          
          <nav className="space-y-2">
            <NavItem view={View.ROSTER} icon={Calendar} label="排班作業" />
            <NavItem view={View.STAFF} icon={Users} label="人員管理" />
            <NavItem view={View.SETTINGS} icon={Settings} label="系統設定" />
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 bg-slate-50 border-t border-slate-100">
           <p className="text-xs text-slate-400 text-center">
             &copy; {new Date().getFullYear()} NurseAI Scheduler
           </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-8 pt-16 lg:pt-8">
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* View Switcher */}
        {currentView === View.ROSTER && (
          <div className="flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                <button 
                   onClick={() => setCurrentDate(d => d.month === 1 ? {year: d.year -1, month: 12} : {...d, month: d.month - 1})}
                   className="p-1 hover:bg-slate-100 rounded"
                >
                  ←
                </button>
                <span className="text-lg font-bold min-w-[120px] text-center">
                  {currentDate.year}年 {currentDate.month}月
                </span>
                <button 
                  onClick={() => setCurrentDate(d => d.month === 12 ? {year: d.year + 1, month: 1} : {...d, month: d.month + 1})}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  →
                </button>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                 {activeRoster ? (
                   <button
                    onClick={handleClearRoster}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                   >
                     <Undo2 className="w-4 h-4" />
                     重設條件 / 重新排班
                   </button>
                 ) : (
                   <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`
                      flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold shadow-sm transition-all
                      ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-blue-600 hover:from-sky-500 hover:to-blue-500'}
                    `}
                   >
                     {isGenerating ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                         AI 智能排班中...
                       </>
                     ) : (
                       <>
                         <Sparkles className="w-4 h-4" />
                         確認預假並生成排班
                       </>
                     )}
                   </button>
                 )}
              </div>
            </div>

            <div className="flex-1 min-h-[400px]">
              {activeRoster ? (
                <RosterView roster={activeRoster} nurses={getNurses()} />
              ) : (
                <RequestGrid 
                  year={currentDate.year} 
                  month={currentDate.month} 
                  nurses={getNurses()}
                  requests={requests}
                  onChange={handleRequestChange}
                />
              )}
            </div>
          </div>
        )}

        {currentView === View.STAFF && <NurseManager />}
        
        {currentView === View.SETTINGS && (
           <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                <Settings className="w-6 h-6 text-primary" />
                系統設定
             </h2>
             
             <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Key className="w-5 h-5 text-slate-600" />
                    Google Gemini API Key 設定
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    如果您在 Vercel 或其他靜態環境部署，且未設定環境變數，請在此輸入您的 API Key。
                    <br />
                    Key 將儲存於您的瀏覽器 LocalStorage 中。
                </p>
                
                <div className="flex flex-col gap-3">
                    <input 
                        type="password" 
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="輸入 API Key (例如: AIzaSy...)"
                        className="p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary w-full"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            {savedKeyObfuscated ? `目前已儲存: ${savedKeyObfuscated}` : '尚未儲存 Key'}
                        </span>
                        <button 
                            onClick={saveApiKey}
                            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            儲存設定
                        </button>
                    </div>
                </div>
             </div>
             
             <div className="text-sm text-slate-400 text-center">
                 此 Key 僅用於呼叫 Google Gemini API，不會傳送至其他伺服器。
             </div>
           </div>
        )}

      </main>
    </div>
  );
};

export default App;