import { DynamoDB } from 'aws-sdk';
import {IBaseWallet, IWalletDB} from "../models/wallet";
const dynamoDB = new DynamoDB.DocumentClient();

export const createWallet = async (walletData: IBaseWallet, userId: string) => {
  const timestamp = new Date().toISOString();
  const id = Math.floor(Math.random() * 1000000).toString();
  const walletItem: IWalletDB = {
    ...walletData,
    currentBalance: walletData.startingBalance,
    id: id,
    userId: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const params = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Item: walletItem,
  };

  try {
    await dynamoDB.put(params).promise();

    return walletItem;
  } catch (error) {
    throw error;
  }
}

export async function getWallet(walletId: string) {
  const params = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Key: {
      id: walletId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();
    return Item as IWalletDB;
  } catch (error) {
    throw error;
  }
}

export const getWallets = async (userId: string) => {
  const walletsParams = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    FilterExpression: '#userId = :userId',
    ExpressionAttributeNames: {
      '#userId': 'userId',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };

  try {
    const { Items } = await dynamoDB.scan(walletsParams).promise();

    return Items as IWalletDB[];
  } catch (error) {
    throw error;
  }
}

export const updateWallet = async (walletData: IBaseWallet, existingWallet: IWalletDB, walletId: string) => {
  const timestamp = new Date().toISOString();
  const startingBalanceDiff = -existingWallet.startingBalance + walletData.startingBalance
  const params = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Key: {
      id: walletId,
    },
    UpdateExpression: 'set #name = :name, #description = :description, #startingBalance = :startingBalance, #currentBalance = #currentBalance + :startingBalanceDiff, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#description': 'description',
      '#startingBalance': 'startingBalance',
      '#currentBalance': 'currentBalance',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':name': walletData.name,
      ':description': walletData.description,
      ':startingBalance': walletData.startingBalance,
      ':startingBalanceDiff': startingBalanceDiff,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  try {
    const { Attributes } = await dynamoDB.update(params).promise();

    return Attributes as IWalletDB;
  } catch (error) {
    throw error;
  }
}

export const deleteWallet = async (walletId: string) => {
  const [incomes, expenses] = await Promise.all([
    getAllIncomesForWallet(walletId),
    getAllExpensesForWallet(walletId),
  ]);

  const transactionItems = [];

  // Add all incomes for deletion in the transaction
  incomes.forEach((income) => {
    transactionItems.push({
      Delete: {
        TableName: process.env.INCOME_TABLE_NAME || '',
        Key: { id: income.id },
      },
    });
  });

  // Add all expenses for deletion in the transaction
  expenses.forEach((expense) => {
    transactionItems.push({
      Delete: {
        TableName: process.env.EXPENSE_TABLE_NAME || '',
        Key: { id: expense.id },
      },
    });
  });

  // Add the wallet deletion to the transaction
  transactionItems.push({
    Delete: {
      TableName: process.env.WALLET_TABLE_NAME || '',
      Key: { id: walletId },
    },
  });

  const transactionParams = {
    TransactItems: transactionItems,
  };

  try {
    await dynamoDB.transactWrite(transactionParams).promise();
  } catch (error) {
    throw error;
  }
}

async function getAllIncomesForWallet(walletId: string) {
  const params = {
    TableName: process.env.INCOME_TABLE_NAME || '',
    IndexName: 'walletIdIndex', // Specify the secondary index name
    KeyConditionExpression: 'walletId = :walletId',
    ExpressionAttributeValues: {
      ':walletId': walletId,
    },
  };

  try {
    const result = await dynamoDB.query(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error fetching incomes:', error);
    throw error;
  }
}

async function getAllExpensesForWallet(walletId: string) {
  const params = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    IndexName: 'walletIdIndex', // Specify the secondary index name
    KeyConditionExpression: 'walletId = :walletId',
    ExpressionAttributeValues: {
      ':walletId': walletId,
    },
  };

  try {
    const result = await dynamoDB.query(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
}
