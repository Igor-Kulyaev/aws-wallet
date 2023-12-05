interface IWallet {
  name: string;
  description: string;
  startingBalance: number;
  currentBalance: number;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBaseWallet {
  name: string;
  description: string;
  startingBalance: number;
  currentBalance: number;
}

export interface IWalletDB extends IBaseWallet {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}