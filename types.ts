export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  budget_limit: number;
  is_archived: boolean;
}

export interface Expense {
  id: number;
  amount: number;
  category_id: number;
  date: string;
  note?: string;
  is_recurring: boolean;
}

export type Period = 'month' | 'year';
