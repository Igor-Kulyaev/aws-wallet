interface IExpense {
  name: string;
  type: string;
  amount: number;
  id?: string;
  walletId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}