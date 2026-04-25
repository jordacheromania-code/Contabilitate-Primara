export enum TaxRegime {
  MICRO_1 = 'MICRO_1',
  MICRO_3 = 'MICRO_3',
  PROFIT_16 = 'PROFIT_16',
}

export interface Company {
  id: string;
  name: string;
  taxRegime: TaxRegime;
  vatPayer: boolean;
  ownerId: string;
  createdAt: any;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'INCOMING' | 'OUTGOING';
  paymentMethod: 'CASH' | 'BANK';
  category: string;
  description: string;
  date: string;
  documentId?: string;
  companyId: string;
  userId: string;
  createdAt: any;
  vatAmount?: number;
  vatRate?: number;
}
