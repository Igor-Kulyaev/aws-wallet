import React, { memo, Suspense, useCallback } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Outlet, Navigate } from 'react-router-dom';
import WalletsList from "../../../components/WalletsList";
import UsersList from "../../../components/UsersList";
import AuthPage from "../../../components/AuthPage";
import WalletPage from "../../../components/WalletPage";
import IncomesList from "../../../components/IncomesList";
import ExpensesList from "../../../components/ExpensesList";
const AppRouter = () => {
  return (
    <>
      <Routes>
        <Route element={<Outlet />}>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/wallets" element={<WalletsList />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/incomes" element={<IncomesList />} />
          <Route path="/expenses" element={<ExpensesList />} />
        </Route>
      </Routes>
    </>
  )
};

export default memo(AppRouter);