import React, { useState } from 'react';
import { Home, FileText, BarChart3, Settings, LogOut, Upload, ChevronDown, Building2, Plus } from 'lucide-react';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useCompany } from '../contexts/CompanyContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { activeCompany, companies, setActiveCompany } = useCompany();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Monitorizare', icon: Home },
    { id: 'transactions', label: 'Tranzacții', icon: FileText },
    { id: 'upload', label: 'Scanner OCR', icon: Upload },
    { id: 'analytics', label: 'Analize Fiscale', icon: BarChart3 },
    { id: 'settings', label: 'Gestiune Firme', icon: Settings },
  ];

  return (
    <nav className="w-64 bg-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      {/* Company Picker */}
      <div className="p-4 border-b border-slate-800 relative">
        <button 
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="w-full flex items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl hover:bg-slate-800 transition-all border border-slate-800"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xs">
              {activeCompany?.name.substring(0, 2).toUpperCase() || '??'}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-xs font-black truncate">{activeCompany?.name || 'Alege Firme'}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Activează entitatea</p>
            </div>
          </div>
          <ChevronDown size={14} className={cn("text-slate-500 transition-transform", isPickerOpen && "rotate-180")} />
        </button>

        {isPickerOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => {
                  setActiveCompany(company);
                  setIsPickerOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 hover:bg-slate-800 transition-colors text-left",
                  activeCompany?.id === company.id ? "text-blue-400" : "text-slate-400"
                )}
              >
                <Building2 size={14} />
                <span className="text-xs font-bold truncate">{company.name}</span>
              </button>
            ))}
            <button
              onClick={() => {
                setActiveTab('settings');
                setIsPickerOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 transition-colors text-left border-t border-slate-800 text-slate-500"
            >
              <Plus size={14} />
              <span className="text-xs font-bold">Adaugă Firmă Nouă</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 space-y-2 mt-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-slate-800">
        <button 
          onClick={() => auth.signOut()}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
        >
          <LogOut size={18} />
          <span>Deconectare</span>
        </button>
      </div>
    </nav>
  );
};
