
import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, Sparkles, AlertCircle, Menu, X, Undo2, Save, Cpu, Key, ExternalLink } from 'lucide-react';
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

// Use inline type definition for window.aistudio to avoid naming collisions with pre-existing global types
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const AVAILABLE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (推薦)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (最高智能)' },
  { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Flash Lite (穩定)' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ROSTER);
  const [currentDate, setCurrentDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [activeRoster, setActiveRoster] = useState<MonthlyRoster | null>(null);
  const [requests, setRequests] = useState<RequestMap>({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Settings State
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  useEffect(() => {
    const stored = getRoster(currentDate.year, currentDate.month);
    setActiveRoster(stored);
    setRequests({});
  }, [currentDate]);

  useEffect(() => {
    const storedModel = localStorage.getItem('nurseai_model');
    if (storedModel) {
      setSelectedModel(storedModel);
    }
    
    // Initial check for key
    const checkInitialKey = async () => {
      const envKey = process.env.API_KEY;
      if (!envKey || envKey === "undefined" || envKey === "") {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(false);
          setError("未偵測到 API Key。請確認您的 Vercel 或環境變數中已正確設定 API_KEY。");
        }
      } else {
        setHasApiKey(true);
      }
    };
    
    checkInitialKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); 
      setError(null);
    }
  };

  const handleRequestChange = (nurseId: string, day: number, shift: ShiftType | undefined) => {
    setRequests(prev => {
      const nurseRequests = { ...prev[nurseId] };
      if (shift === undefined) {
        delete nurseRequests[day];
      } else {
        nurseRequests[day] = shift;
      }
      return { ...prev, [nurseId]: nurseRequests };
    });
  };

  const handleGenerate = async () => {
    const nurses = getNurses();
    if (nurses.length === 0) {
      setError("請先至人員管理新增護理師資料。");
      return;
    }

    // Double check key existence right before generating
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
        if (window.aistudio) {
            await handleOpenKeyDialog();
        } else {
            setError("API Key 缺失。請在 Vercel 專案設定中的 Environment Variables 加入 API_KEY。");
            return;
        }
    }

    setIsGenerating(true);
    setError(null);

    try {
      const newRoster = await generateSchedule(
        currentDate.year, 
        currentDate.month, 
        nurses, 
        requests,
        selectedModel
      );
      saveRoster(newRoster);
      setActiveRoster(newRoster);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("API Key") || msg.includes("Requested entity was not found") || msg.includes("401") || msg.includes("403")) {
        setError("API 認證失敗。如果您正在 Vercel，請確認已設定 API_KEY；或點擊下方按鈕連結。");
        setHasApiKey(false);
      } else {
        setError(msg || "排班失敗，請稍後再試。");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearRoster = () => {
    if (confirm('確定要重新排班嗎？目前的排班表將被清除。')) {
      setActiveRoster(null);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('nurseai_model', selectedModel);
    alert(`已儲存。`);
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
        <div className="flex items-center gap-2">
          {!hasApiKey && window.aistudio && (
            <button onClick={handleOpenKeyDialog} className="p-2 text-red-500"><Key className="w-5 h-5"/></button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
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

        {window.aistudio && (
          <div className="px-6 mb-4">
             <button 
               onClick={handleOpenKeyDialog}
               className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold border transition-colors ${!hasApiKey ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
             >
               <Key className="w-4 h-4" />
               {hasApiKey ? 'API Key 已連結' : '未連結 API Key'}
             </button>
          </div>
        )}

        <div className="absolute bottom-0 w-full p-6 bg-slate-50 border-t border-slate-100">
           <p className="text-xs text-slate-400 text-center">
             &copy; {new Date().getFullYear()} NurseAI Scheduler
           </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-8 pt-16 lg:pt-8">
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-sm font-medium">{error}</div>
            {window.aistudio && !hasApiKey && (
              <button 
                onClick={handleOpenKeyDialog}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-bold"
              >
                立即連結 Key
              </button>
            )}
          </div>
        )}

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
                         生成排班表
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
                    <Cpu className="w-5 h-5 text-slate-600" />
                    AI 模型選擇
                </h3>
                <div className="flex flex-col gap-3">
                   <select 
                     value={selectedModel}
                     onChange={(e) => setSelectedModel(e.target.value)}
                     className="p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary w-full text-sm"
                   >
                     {AVAILABLE_MODELS.map(m => (
                       <option key={m.id} value={m.id}>{m.name}</option>
                     ))}
                   </select>
                </div>
             </div>

             <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-600" />
                      API Key 管理
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                      {window.aistudio 
                        ? "本系統偵測到 AI Studio 環境。若排班失敗，請點擊下方按鈕重新選取 API Key。" 
                        : "若您在 Vercel 部署，請確保專案設定中已加入 API_KEY 環境變數。"}
                  </p>
                  <div className="flex flex-col gap-3">
                    {window.aistudio && (
                      <button 
                        onClick={handleOpenKeyDialog}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        連結 API Key
                      </button>
                    )}
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1"
                    >
                      查看 Google API 計費說明 <ExternalLink className="w-3 h-3"/>
                    </a>
                  </div>
                </div>
             
             <div className="flex justify-end">
                <button 
                    onClick={saveSettings}
                    className="bg-primary text-white px-6 py-2.5 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 font-bold shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    儲存所有設定
                </button>
             </div>
           </div>
        )}

      </main>
    </div>
  );
};

export default App;
