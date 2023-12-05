export interface IBaseIncome {
  name: string;
  type: string;
  amount: number;
}

export interface IIncomeDB extends IBaseIncome {
  id: string;
  walletId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}