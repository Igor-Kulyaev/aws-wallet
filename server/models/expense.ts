export interface IBaseExpense {
  name: string;
  type: string;
  amount: number;
}

export interface IExpenseDB extends IBaseExpense {
  id: string;
  walletId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}