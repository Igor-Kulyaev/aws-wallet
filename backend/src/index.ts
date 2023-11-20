import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 5000;

// Need middleware to verify user and retrieve his id

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript Express!');
});

app.get('/user/:id', (req: Request, res: Response) => {
  // admin or account owner can get user details
  res.send('User data');
});

app.get('/users', (req: Request, res: Response) => {
  // admin can get users list
  res.send('Users list');
});

app.get('/wallets', (req: Request, res: Response) => {
  // admin or account owner can get wallets list
  // need to retrieve user id and role from token in middleware
  res.send('Wallets list');
});

app.get('/wallet/:walletId', (req: Request, res: Response) => {
  // admin or account owner can get wallet details
  // need to retrieve user id and role from token in middleware
  res.send('Wallet');
});

app.get('/expenses', (req: Request, res: Response) => {
  // admin or account owner can get expenses list
  // need to retrieve user id and role from token in middleware
  res.send('Expenses list');
});

app.get('/incomes', (req: Request, res: Response) => {
  // admin or account owner can get incomes list
  // need to retrieve user id and role from token in middleware
  res.send('Incomes list');
});

app.get('/expenses/:expenseId', (req: Request, res: Response) => {
  // admin or account owner can get expense details
  // need to retrieve user id and role from token in middleware
  res.send('Wallet');
});

app.get('/incomes/:incomeId', (req: Request, res: Response) => {
  // admin or account owner can get income details
  // need to retrieve user id and role from token in middleware
  res.send('Wallet');
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});