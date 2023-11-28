interface IWallet {
  name: string;
  description: string;
  startingBalance: number;
  currentBalance: number;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}