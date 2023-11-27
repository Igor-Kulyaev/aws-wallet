interface Wallet {
  name: string;
  description: string;
  startingBalance: number;
  currentBalance: number;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}