export enum UserRole {
  User = 'User',
  Admin = 'Admin',

}
export interface IUser {
  firstName: string;
  lastName: string;
  role: UserRole;
  birthday: string;
  email: string;
  password: string;
}

export interface IWallet {
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  startingBalance: number;
  currentBalance: number;
}

export interface IIncome {
  walletId: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  amount: number;
}

export interface IExpense {
  walletId: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  amount: number;
}