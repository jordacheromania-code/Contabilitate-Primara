import React, { useState } from 'react';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useCompany } from '../contexts/CompanyContext';
import { TaxRegime } from '../types';
import { Building2, Percent, Save, CheckCircle2, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const { companies, loading } = useCompany();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [companyName, setCompanyName] = useState('');
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(TaxRegime.MICRO_1);
  const [vatPayer, setVatPayer] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setCompanyName('');
    setTaxRegime(TaxRegime.MICRO_1);
    setVatPayer(false);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (company: any) => {
    setCompanyName(company.name);
    setTaxRegime(company.taxRegime);
    setVatPayer(company.vatPayer);
    setEditingId(company.id);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setStatus('saving');
    try {
      if (editingId) {
        await updateDoc(doc(db, 'companies', editingId), {
          name: companyName,
          taxRegime,
          vatPayer,
        });
      } else {
        await addDoc(collection(db, 'companies'), {
          name: companyName,
          taxRegime,
          vatPayer,
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }
      
      setStatus('saved');
      setTimeout(() => {
        setStatus('idle');
        resetForm();
      }, 1500);
    } catch (error) {
      console.error("Error saving company:", error);
      setStatus('idle');
      handleFirestoreError(error, OperationType.WRITE, `companies/${editingId || 'new'}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'companies', id));
      setConfirmingDeleteId(null);
    } catch (error) {
      console.error("Error deleting company:", error);
      handleFirestoreError(error, OperationType.DELETE, `companies/${id}`);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestiune Firme</h2>
          <p className="text-slate-500 font-medium">Administrează entitățile tale fiscale și regimurile de impozitare.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            <span>Adaugă Firmă</span>
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="space-y-8">
          <button 
            onClick={resetForm}
            className="text-slate-500 font-bold text-sm flex items-center gap-2 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} /> Înapoi la listă
          </button>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Building2 size={14} />
                  <span>Entitate Fiscală</span>
                </label>
                <input
                  required
                  type="text"
                  className="w-full pl-6 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-base font-bold text-slate-900"
                  placeholder="Nume Firmă / PFA..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-6">
                 <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Percent size={14} />
                  <span>Regim Impozitare</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <RegimeOption 
                    active={taxRegime === TaxRegime.MICRO_1} 
                    onClick={() => setTaxRegime(TaxRegime.MICRO_1)}
                    title="Micro 1%" 
                    desc="Venituri < 60k EUR"
                  />
                  <RegimeOption 
                    active={taxRegime === TaxRegime.MICRO_3} 
                    onClick={() => setTaxRegime(TaxRegime.MICRO_3)}
                    title="Micro 3%" 
                    desc="Venituri > 60k EUR"
                  />
                  <RegimeOption 
                    active={taxRegime === TaxRegime.PROFIT_16} 
                    onClick={() => setTaxRegime(TaxRegime.PROFIT_16)}
                    title="Profit 16%" 
                    desc="Impozit pe profit"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-lg border border-slate-200/50">
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">Plătitor de TVA</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Înregistrat în scopuri de TVA</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVatPayer(!vatPayer)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    vatPayer ? 'bg-blue-600' : 'bg-slate-300'
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    vatPayer ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'saving'}
              className={cn(
                "w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all shadow-md",
                status === 'saved' ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {status === 'saving' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : status === 'saved' ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>Companie Salvată</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>{editingId ? 'Salvează Modificările' : 'Creează Firma'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map(company => (
            <div key={company.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Building2 size={20} />
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-tight">
                    {company.taxRegime}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{company.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  {company.vatPayer ? 'Plătitor TVA' : 'Neplătitor TVA'}
                </p>
              </div>
              
              <div className="mt-8 flex gap-2 pt-6 border-t border-slate-100 transition-all">
                {confirmingDeleteId === company.id ? (
                  <div className="flex-1 flex gap-2 animate-in zoom-in-95 duration-200">
                    <button 
                      onClick={() => handleDelete(company.id)}
                      className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black hover:bg-rose-700 transition-colors"
                    >
                      CONFIRMĂ ȘTERGEREA
                    </button>
                    <button 
                      onClick={() => setConfirmingDeleteId(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      Renunță
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleEdit(company)}
                      className="flex-1 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      Editează
                    </button>
                    <button 
                      onClick={() => setConfirmingDeleteId(company.id)}
                      className="px-4 py-2 bg-slate-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {companies.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border border-slate-200 border-dashed">
               <Building2 size={40} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-500 font-bold">Nicio firmă înregistrată încă.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RegimeOption: React.FC<{ active: boolean; onClick: () => void; title: string; desc: string }> = ({ 
  active, onClick, title, desc 
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "text-left p-4 rounded-lg border-2 transition-all duration-200",
      active 
        ? "border-blue-600 bg-blue-50/30" 
        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
    )}
  >
    <p className={cn("text-xs font-black uppercase tracking-wider", active ? "text-blue-600" : "text-slate-900")}>{title}</p>
    <p className="text-[10px] text-slate-400 mt-1 font-medium">{desc}</p>
  </button>
);
