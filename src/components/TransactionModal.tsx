import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Building2 } from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCompany } from '../contexts/CompanyContext';
import { cn } from '../lib/utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'INCOMING' | 'OUTGOING';
  initialPaymentMethod?: 'CASH' | 'BANK';
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  type: initialType = 'OUTGOING',
  initialPaymentMethod = 'BANK'
}) => {
  const { activeCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: initialType,
    paymentMethod: initialPaymentMethod,
    category: 'General',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        type: initialType,
        paymentMethod: initialPaymentMethod
      }));
    }
  }, [isOpen, initialType, initialPaymentMethod]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !activeCompany) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        amount: parseFloat(formData.amount),
        type: formData.type,
        paymentMethod: formData.paymentMethod,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        companyId: activeCompany.id,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      onClose();
      setFormData({
        amount: '',
        type: initialType,
        paymentMethod: 'BANK',
        category: 'General',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Adaugă Tranzacție</h3>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
              <Building2 size={10} /> {activeCompany?.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {!activeCompany && (
           <div className="p-6 bg-amber-50 flex items-start gap-3 border-b border-amber-100">
            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
            <p className="text-xs text-amber-700 font-medium">Trebuie să selectezi sau să creezi o firmă din meniu înainte de a adăuga tranzacții.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tip Operațiune</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'INCOMING' })}
                className={cn(
                  "py-3 rounded-xl border-2 font-bold text-sm transition-all",
                  formData.type === 'INCOMING' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-100 text-slate-400"
                )}
              >
                Încasare (+)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'OUTGOING' })}
                className={cn(
                  "py-3 rounded-xl border-2 font-bold text-sm transition-all",
                  formData.type === 'OUTGOING' ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-100 text-slate-400"
                )}
              >
                Plată (-)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Metodă Plată</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'BANK' })}
                className={cn(
                  "py-3 rounded-xl border-2 font-bold text-sm transition-all",
                  formData.paymentMethod === 'BANK' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 text-slate-400"
                )}
              >
                BANCĂ
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'CASH' })}
                className={cn(
                  "py-3 rounded-xl border-2 font-bold text-sm transition-all",
                  formData.paymentMethod === 'CASH' ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-100 text-slate-400"
                )}
              >
                CASH
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Suma (RON)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Data Document</label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Explicație / Descriere</label>
            <textarea
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all min-h-[80px] resize-none"
              placeholder="ex: Factură servicii IT luna Aprilie..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Categorie (Opțional)</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all"
              placeholder="ex: Utilități, Salarii, Chirie"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              disabled={loading || !activeCompany}
              type="submit"
              className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>Înregistrează Tranzacția</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
