import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { DocumentUploader } from './components/DocumentUploader';
import { Settings as SettingsView } from './components/Settings';
import { signInWithGoogle } from './lib/firebase';
import { BarChart3, LogIn, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accessCode, setAccessCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem('is_team_member_authorized') === 'true';
  });

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === 'alexcod01') {
      setIsAuthorized(true);
      localStorage.setItem('is_team_member_authorized', 'true');
    } else {
      alert('Cod de acces incorect.');
    }
  };

  useEffect(() => {
    const handleNavigate = (e: any) => setActiveTab(e.detail);
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-12"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-600/30">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Acces Securizat</h2>
              <p className="text-slate-400 text-sm font-medium">Platformă rezervată exclusiv echipei SmartFiscal.</p>
            </div>
          </div>

          <form onSubmit={handleAccess} className="space-y-4">
            <div className="space-y-2">
              <input 
                type="password"
                placeholder="COD ACCES"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-5 py-4 text-white font-black placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none transition-all text-center tracking-[0.5em] text-lg uppercase"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all active:scale-[0.98]"
            >
              Validează Accesul
            </button>
          </form>

          <p className="text-center text-[10px] font-black text-slate-800 uppercase tracking-widest border-t border-slate-900 pt-8 mt-12">
            Autentificare Echipă . v1.0
          </p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 className="text-indigo-600" size={24} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600 rounded-full blur-[128px] animate-pulse [animation-delay:1s]" />
        </div>

        <div className="max-w-xl w-full text-center space-y-10 relative z-10">
          <div className="space-y-6">
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-blue-600/30 font-black text-xl"
            >
              FT
            </motion.div>
            <div className="space-y-2">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl font-black tracking-tighter"
              >
                SmartFiscal <span className="text-blue-500">RO</span>
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-400 font-medium max-w-sm mx-auto leading-relaxed"
              >
                Gestiune financiară modernă. Scanare AI, taxe automate și conformitate ANAF.
              </motion.p>
            </div>
          </div>

          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
          >
             <button 
              onClick={() => signInWithGoogle()}
              className="group w-full flex items-center justify-center gap-3 bg-white text-slate-950 py-4 px-8 rounded-xl font-bold text-base transition-all hover:shadow-2xl hover:shadow-white/10 active:scale-[0.98]"
            >
               <LogIn size={20} />
               <span>Continuă cu Google Workspace</span>
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
          >
            <div className="flex items-center gap-2"><Sparkles size={12} /> OCR ENGINE</div>
            <div className="flex items-center gap-2"><Zap size={12} /> ANAF READY</div>
            <div className="flex items-center gap-2"><ShieldCheck size={12} /> DATA PROTECTION</div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pl-64">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="p-12 max-w-[1400px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'upload' && <DocumentUploader />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'analytics' && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center">
                  <Sparkles size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Modul Analitice Avansate</h2>
                <p className="text-slate-500 max-w-md">Calculăm rapoarte detaliate pentru dividende, CASS și contribuții sociale în funcție de noile date introduse.</p>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-6 text-indigo-600 font-bold hover:underline"
                >
                  Înapoi la Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <MainApp />
      </CompanyProvider>
    </AuthProvider>
  );
}
