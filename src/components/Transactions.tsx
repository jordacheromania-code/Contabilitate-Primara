import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, ExternalLink, Filter, Plus, Search, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { TransactionModal } from './TransactionModal';
import { useCompany } from '../contexts/CompanyContext';
import { Transaction } from '../types';

export const Transactions: React.FC = () => {
  const { activeCompany } = useCompany();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!auth.currentUser || !activeCompany) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('companyId', '==', activeCompany.id),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    });

    return () => unsubscribe();
  }, [activeCompany?.id]);

  const filteredTransactions = transactions
    .filter(t => filter === 'ALL' || t.type === filter)
    .filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi această tranzacție?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Istoric Tranzacții</h2>
          <p className="text-sm text-slate-500 font-medium font-sans">Registru jurnal digital</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus size={18} />
          <span>+ Adaugă Tranzacție</span>
        </button>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-sans" size={16} />
          <input
            type="text"
            placeholder="Căutare după descriere, categorie sau document..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {(['ALL', 'INCOMING', 'OUTGOING'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {f === 'ALL' ? 'Toate' : f === 'INCOMING' ? 'Încasări' : 'Plăți'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[520px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Data Document</th>
                <th className="px-5 py-4">Descriere / Sursă</th>
                <th className="px-5 py-4">Categorie</th>
                <th className="px-5 py-4">Suma (TVA incl.)</th>
                <th className="px-5 py-4">Metodă</th>
                <th className="px-5 py-4">Tip</th>
                <th className="px-5 py-4 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-500">
                    {format(new Date(t.date), 'dd.MM.yyyy', { locale: ro })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{t.description}</span>
                      {t.documentId && (
                        <span className="text-[9px] text-blue-500 font-black uppercase flex items-center gap-1 mt-1">
                          <Sparkles size={10} /> OCR Procesat
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-black uppercase tracking-tight">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "font-black tracking-tight",
                      t.type === 'INCOMING' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(t.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] uppercase font-black",
                      t.paymentMethod === 'CASH' ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] uppercase font-black",
                      t.type === 'INCOMING' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {t.type === 'INCOMING' ? 'Încasare' : 'Plată'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      {t.documentId && (
                        <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all">
                          <ExternalLink size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Search size={24} />
              </div>
              <div className="max-w-xs mx-auto">
                <p className="text-slate-900 font-bold text-sm">Niciun rezultat găsit</p>
                <p className="text-slate-400 text-xs">Încearcă să resetezi filtrele sau să adaugi o tranzacție manuală.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
