import { DynamoDB } from 'aws-sdk';
import {IBaseIncome, IIncomeDB} from "../models/income";

const dynamoDB = new DynamoDB.DocumentClient();

export async function getIncome(incomeId: string) {
  const params = {
    TableName: process.env.INCOME_TABLE_NAME || '',
    Key: {
      id: incomeId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();
    return Item as IIncomeDB;
  } catch (error) {
    throw error;
  }
}

export const createIncome = async (walletId: string, userId: string, incomeData: IBaseIncome) => {
  const incomeTimestamp = new Date().toISOString();
  const id = Math.floor(Math.random() * 1000000).toString();
  const incomeItem = {
    ...incomeData,
    id: id,
    walletId: walletId,
    userId: userId,
    createdAt: incomeTimestamp,
    updatedAt: incomeTimestamp,
  };

  const incomeParams = {
    TableName: process.env.INCOME_TABLE_NAME || '',
    Item: incomeItem,
  };

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
      ':amount': incomeData.amount,
      ':updatedAt': incomeTimestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  const transactionParams = {
    TransactItems: [
      {
        Put: incomeParams,
      },
      {
        Update: walletParams,
      },
    ],
  };

  try {
    await dynamoDB.transactWrite(transactionParams).promise();

    return incomeItem as IIncomeDB;
  } catch (error) {
    throw error;
  }
}

export const getIncomes = async (walletId: string) => {
  const params = {
    TableName: process.env.INCOME_TABLE_NAME || '',
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

    return Items as IIncomeDB[];
  } catch (error) {
    throw error;
  }
}

export const updateIncome = async (incomeId: string, walletId: string, incomeData: IBaseIncome, existingIncome: IIncomeDB) => {
  const timestamp = new Date().toISOString();
  const incomeParams = {
    TableName: process.env.INCOME_TABLE_NAME || '',
    Key: {
      id: incomeId,
    },
    UpdateExpression: 'set #name = :name, #type = :type, #amount = :amount, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#type': 'type',
      '#amount': 'amount',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':name': incomeData.name,
      ':type': incomeData.type,
      ':amount': incomeData.amount,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  // get difference between previous amount and new amount for updating balance
  const newAmount = -existingIncome.amount + incomeData.amount;

  const walletParams = {
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
        Update: incomeParams,
      },
      {
        Update: walletParams,
      },
    ],
  };

  try {
    await dynamoDB.transactWrite(transactionParams).promise();

    return ({
      ...existingIncome,
      name: incomeData.name,
      type: incomeData.type,
      amount: incomeData.amount,
      updatedAt: timestamp
    }) as IIncomeDB;
  } catch (error) {
    throw error;
  }
}

export const deleteIncome = async (incomeId: string, walletId: string, existingIncome: IIncomeDB) => {
  const incomeParams = {
    TableName: process.env.INCOME_TABLE_NAME || '',
    Key: {
      id: incomeId,
    },
  };

  const timestamp = new Date().toISOString();

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
      ':amount': existingIncome.amount,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  const transactionParams = {
    TransactItems: [
      {
        Delete: incomeParams,
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
