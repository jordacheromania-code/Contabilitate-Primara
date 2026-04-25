import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Wallet, Calculator, TrendingUp, Plus, Building2 } from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import { calculateEstimatedTax } from '../lib/taxUtils';
import { cn } from '../lib/utils';
import { Transaction, TaxRegime } from '../types';

import { TransactionModal } from './TransactionModal';

export const Dashboard: React.FC = () => {
  const { activeCompany, companies, loading: companyLoading } = useCompany();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  const [modalPaymentMethod, setModalPaymentMethod] = useState<'CASH' | 'BANK'>('BANK');

  useEffect(() => {
    if (!auth.currentUser || !activeCompany) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('companyId', '==', activeCompany.id),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubTx = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Transaction);
      setTransactions(data);
      setLoading(false);
    });

    return () => unsubTx();
  }, [activeCompany?.id]);

  const totalIncome = transactions
    .filter(t => t.type === 'INCOMING')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashIncome = transactions
    .filter(t => t.type === 'INCOMING' && t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.amount, 0);

  const bankIncome = transactions
    .filter(t => t.type === 'INCOMING' && t.paymentMethod === 'BANK')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'OUTGOING')
    .reduce((sum, t) => sum + t.amount, 0);

  const estimatedTax = activeCompany ? calculateEstimatedTax(totalIncome, totalExpenses, activeCompany.taxRegime) : 0;
  const netProfit = totalIncome - totalExpenses - estimatedTax;

  const chartData = [
    { name: 'Venituri Total', value: totalIncome, color: '#4f46e5' },
    { name: 'Venituri Cash', value: cashIncome, color: '#f59e0b' },
    { name: 'Cheltuieli', value: totalExpenses, color: '#f43f5e' },
    { name: 'Impozit', value: estimatedTax, color: '#64748b' },
  ];

  if (companyLoading || loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!activeCompany && companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-sm">
          <Building2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Bine ai venit la SmartFiscal!</h2>
          <p className="text-slate-500 max-w-sm mx-auto">Pentru a începe monitorizarea activității tale, te rugăm să adaugi prima ta firmă sau entitate fiscală.</p>
        </div>
        <button 
          onClick={() => {
            // Need a way to switch tabs or open settings
            const event = new CustomEvent('navigate', { detail: 'settings' });
            window.dispatchEvent(event);
          }}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          Configurează Prima Firmă
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeCompany?.name}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Regim: {activeCompany?.taxRegime} • Monitorizare timp real</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black ring-1 ring-blue-700/10 uppercase tracking-widest">
            {activeCompany?.taxRegime === TaxRegime.MICRO_1 ? 'Impozit: 1%' : activeCompany?.taxRegime === TaxRegime.MICRO_3 ? 'Impozit: 3%' : 'Impozit: 16%'}
          </span>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm">
            <TrendingUp className="text-emerald-500" size={16} />
            <span className="text-[10px] font-black text-slate-700 uppercase">MARJĂ: {totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Venituri Total" value={totalIncome} icon={ArrowUpRight} color="text-indigo-600" bg="bg-indigo-50" trend={`Bancă: ${new Intl.NumberFormat('ro-RO').format(bankIncome)}`} />
        <StatCard 
          title="Încasări Cash" 
          value={cashIncome} 
          icon={Wallet} 
          color="text-amber-600" 
          bg="bg-amber-50" 
          trend="Numerar" 
          action={{
            label: "Adaugă Manual",
            onClick: () => {
              setModalType('INCOMING');
              setModalPaymentMethod('CASH');
              setIsModalOpen(true);
            }
          }}
        />
        <StatCard title="Plăți / Cheltuieli" value={totalExpenses} icon={ArrowDownLeft} color="text-rose-600" bg="bg-rose-50" trend="Total ieșiri" />
        <StatCard title="Impozit Estimat" value={estimatedTax} icon={Calculator} color="text-slate-600" bg="bg-slate-100" trend="Provizionat" />
        <StatCard title="Profit Net" value={netProfit} icon={TrendingUp} color="text-emerald-700" bg="bg-emerald-50" trend="Rămas după taxe" variant="special" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Ultimele Tranzacții Procesate</h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Venituri</span>
               </div>
               <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Cheltuieli</span>
               </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-8 pb-4 border-b border-slate-100">Distribuție Categorii</h3>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(
                    transactions
                      .filter(t => t.type === 'OUTGOING')
                      .reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {} as Record<string, number>)
                  ).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#2563eb', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType}
        initialPaymentMethod={modalPaymentMethod}
      />
    </div>
  );
};

const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  icon: any; 
  color: string; 
  bg: string;
  trend?: string;
  variant?: 'special';
  action?: { label: string; onClick: () => void };
}> = ({ title, value, icon: Icon, color, bg, trend, variant, action }) => (
  <div className={cn(
    "p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300 flex flex-col justify-between",
    variant === 'special' ? "bg-blue-50/50" : "bg-white"
  )}>
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", bg, color)}>
          <Icon size={18} />
        </div>
      </div>
      <p className={cn("text-[10px] uppercase font-black tracking-wider mb-1", variant === 'special' ? "text-blue-600" : "text-slate-400")}>
        {title}
      </p>
      <h3 className={cn("text-2xl font-black tracking-tight", color)}>
        {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(value)}
      </h3>
      {trend && (
        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">
          {trend}
        </p>
      )}
    </div>
    
    {action && (
      <button 
        onClick={action.onClick}
        className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={12} />
        {action.label}
      </button>
    )}
  </div>
);
