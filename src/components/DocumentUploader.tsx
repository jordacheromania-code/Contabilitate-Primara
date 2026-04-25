import React, { useState, useCallback } from 'react';
import { Upload, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { extractTextFromFile } from '../services/documentService';
import { extractFinancialDataFromText } from '../services/geminiService';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useCompany } from '../contexts/CompanyContext';

export const DocumentUploader: React.FC = () => {
  const { activeCompany } = useCompany();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; status: 'success' | 'error'; message: string }[]>([]);

  const processFile = async (file: File) => {
    if (!auth.currentUser || !activeCompany) return;
    
    setIsProcessing(true);
    try {
      // 1. Extract text
      const text = await extractTextFromFile(file);
      
      // 2. Extract data via Gemini
      const data = await extractFinancialDataFromText(text);
      
      // 3. Save to Firestore (Document record)
      const docRef = await addDoc(collection(db, 'documents'), {
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        contentMarkup: text,
        extractedData: data,
        status: 'PROCESSED',
        companyId: activeCompany.id,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // 4. Create Transaction record
      await addDoc(collection(db, 'transactions'), {
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description || `Scanat din ${file.name}`,
        date: data.date,
        documentId: docRef.id,
        companyId: activeCompany.id,
        vatAmount: data.vatAmount || 0,
        vatRate: data.vatRate || 0,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setResults(prev => [{ name: file.name, status: 'success', message: 'Procesat cu succes!' }, ...prev]);
    } catch (error) {
      console.error(error);
      setResults(prev => [{ name: file.name, status: 'error', message: 'Eroare la procesare.' }, ...prev]);
      handleFirestoreError(error, OperationType.WRITE, 'documents/transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    files.forEach(processFile);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Procesare Documente OCR</h2>
        <p className="text-slate-500 font-medium font-sans">AI-ul nostru extrage automat datele din PDF, DOCX și XLSX pentru conformitate ANAF.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-16 transition-all duration-300 flex flex-col items-center justify-center gap-6 text-center group overflow-hidden shadow-sm",
          isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50"
        )}
      >
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
          isDragging ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
        )}>
          {isProcessing ? (
            <Loader2 size={32} className="animate-spin" />
          ) : (
            <Upload size={32} />
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900">
            {isProcessing ? "Analiză fiscală în curs..." : "Încarcă Documente"}
          </h3>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">PDF, DOCX, XLSX, JPEG</p>
        </div>

        {!isProcessing && (
          <button className="px-6 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:border-slate-400 transition-all shadow-sm">
            Selectează Fișiere
          </button>
        )}

        <input
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Activitate Recentă</h4>
        <AnimatePresence>
          {results.map((res, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-sm"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                res.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {res.status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{res.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{res.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
