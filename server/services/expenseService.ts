import {DynamoDB} from "aws-sdk";
import {IBaseExpense, IExpenseDB} from "../models/expense";

const dynamoDB = new DynamoDB.DocumentClient();

export async function getExpense(expenseId: string) {
  const params = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    Key: {
      id: expenseId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();
    return Item as IExpenseDB;
  } catch (error) {
    throw error;
  }
}

export const createExpense = async (walletId: string, userId: string, expenseData: IBaseExpense) => {
  const expenseTimestamp = new Date().toISOString();
  const id = Math.floor(Math.random() * 1000000).toString();
  const expenseItem = {
    ...expenseData,
    id: id,
    walletId: walletId,
    userId: userId,
    createdAt: expenseTimestamp,
    updatedAt: expenseTimestamp,
  };

  const expenseParams = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    Item: expenseItem,
  };

  const walletParams = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Key: {
      id: walletId,
    },
    UpdateExpression: 'set #currentBalance = #currentBalance - :amount, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#currentBalance': 'currentBalance',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':amount': expenseData.amount,
      ':updatedAt': expenseTimestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  const transactionParams = {
    TransactItems: [
      {
        Put: expenseParams,
      },
      {
        Update: walletParams,
      },
    ],
  };

  try {
    await dynamoDB.transactWrite(transactionParams).promise();

    return expenseItem as IExpenseDB;
  } catch (error) {
    throw error;
  }
}

export const getExpenses = async (walletId: string) => {
  const params = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    FilterExpression: '#walletId = :walletId',
    ExpressionAttributeNames: {
      '#walletId': 'walletId',
    },
    ExpressionAttributeValues: {
      ':walletId': walletId,
    },
  };

  try {
    const { Items } = await dynamoDB.scan(params).promise();

    return Items as IExpenseDB[];
  } catch (error) {
    throw error;
  }
}

export const updateExpense = async (expenseId: string, walletId: string, expenseData: IBaseExpense, existingExpense: IExpenseDB) => {
  const timestamp = new Date().toISOString();
  const expenseParams = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    Key: {
      id: expenseId,
    },
    UpdateExpression: 'set #name = :name, #type = :type, #amount = :amount, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#type': 'type',
      '#amount': 'amount',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':name': expenseData.name,
      ':type': expenseData.type,
      ':amount': expenseData.amount,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  // get difference between previous amount and new amount for updating balance
  const newAmount = existingExpense.amount - expenseData.amount;

  const updateWalletParams = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Key: {
      id: walletId,
    },
    UpdateExpression: 'set #currentBalance = #currentBalance + :newAmount, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#currentBalance': 'currentBalance',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':newAmount': newAmount,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  const transactionParams = {
    TransactItems: [
      {
        Update: expenseParams,
      },
      {
        Update: updateWalletParams,
      },
    ],
  };

  try {
    await dynamoDB.transactWrite(transactionParams).promise();

    return ({
      ...existingExpense,
      name: expenseData.name,
      type: expenseData.type,
      amount: expenseData.amount,
      updatedAt: timestamp
    }) as IExpenseDB;
  } catch (error) {
    throw error;
  }
}

export const deleteExpense = async (expenseId: string, walletId: string, existingExpense: IExpenseDB) => {
  const expenseParams = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    Key: {
      id: expenseId,
    },
  };

  const timestamp = new Date().toISOString();

  const walletParams = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Key: {
      id: walletId,
    },
    UpdateExpression: 'set #currentBalance = #currentBalance + :amount, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#currentBalance': 'currentBalance',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':amount': existingExpense.amount,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  const transactionParams = {
    TransactItems: [
      {
        Delete: expenseParams,
      },
      {
        Update: walletParams,
      },
    ],
  };

  try {
    await dynamoDB.transactWrite(transactionParams).promise();
  } catch (error) {
    throw error;
  }
}
