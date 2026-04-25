import { TaxRegime } from '../types';

export interface TaxCalculation {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  estimatedTax: number;
}

export function calculateEstimatedTax(
  income: number,
  expenses: number,
  regime: TaxRegime
): number {
  switch (regime) {
    case TaxRegime.MICRO_1:
      return income * 0.01;
    case TaxRegime.MICRO_3:
      return income * 0.03;
    case TaxRegime.PROFIT_16:
      const profit = Math.max(0, income - expenses);
      return profit * 0.16;
    default:
      return 0;
  }
}
