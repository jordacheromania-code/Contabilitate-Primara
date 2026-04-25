import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Company } from '../types';
import { useAuth } from '../context/AuthContext';

interface CompanyContextType {
  activeCompany: Company | null;
  companies: Company[];
  loading: boolean;
  setActiveCompany: (company: Company) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setActiveCompany(null);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'companies'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(companyList);
      
      // If no active company, or current active company is not in the list, pick the first one
      if (companyList.length > 0) {
        setLoading(false); // Set loading false before updating active company to avoid flicker
        setActiveCompany(current => {
          if (!current || !companyList.find(c => c.id === current.id)) {
            const savedId = localStorage.getItem(`activeCompany_${user.uid}`);
            return companyList.find(c => c.id === savedId) || companyList[0];
          }
          return current;
        });
      } else {
        setActiveCompany(null);
        setLoading(false);
      }
    }, (error) => {
       console.error("Company Snapshot error:", error);
       setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSetActiveCompany = (company: Company) => {
    setActiveCompany(company);
    if (user) {
      localStorage.setItem(`activeCompany_${user.uid}`, company.id);
    }
  };

  return (
    <CompanyContext.Provider value={{ 
      activeCompany, 
      companies, 
      loading, 
      setActiveCompany: handleSetActiveCompany 
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
