interface IExpense {
  name: string;
  type: string;
  amount: number;
  id?: string;
  walletId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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