import { Handler, APIGatewayEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import {decodeToken} from "../utils/utils";
import {IBaseWallet, IWalletDB} from "../models/wallet";

const dynamoDB = new DynamoDB.DocumentClient();

export async function handlerCreate(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub;
  const walletData = JSON.parse(event.body || '');

  const timestamp = new Date().toISOString();
  const id = Math.floor(Math.random() * 1000000).toString();
  const walletItem = {
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
    return {
      statusCode: 200,
      body: JSON.stringify(walletItem),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating wallet', error }),
    };
  }
}

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
  } catch (error) {
    throw error;
  }
}

export async function handlerRead(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub; // Example: extracting the user ID

  const walletId = event.pathParameters?.walletId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  const params = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Key: {
      id: walletId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Wallet not found' }),
      };
    }

    if (Item.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(Item),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error reading wallet', error }),
    };
  }
}

export const handlerGetAll: Handler = async (event: APIGatewayEvent) => {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub; // Example: extracting the user ID

  try {
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

    const { Items } = await dynamoDB.scan(walletsParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching wallets', error }),
    };
  }
};

export async function handlerUpdate(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub; // Example: extracting the user ID

  const walletId = event.pathParameters?.walletId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  try {
    const existingWallet = await getWallet(walletId); // Function to check if wallet exists

    if (!existingWallet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Wallet not found' }),
      };
    }

    if (existingWallet.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const walletData = JSON.parse(event.body || '');

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

    const { Attributes } = await dynamoDB.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(Attributes),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating wallet', error }),
    };
  }
}

export async function handlerDelete(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub; // Example: extracting the user ID

  const walletId = event.pathParameters?.walletId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  try {
    const existingWallet = await getWallet(walletId); // Function to check if wallet exists

    if (!existingWallet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Wallet not found' }),
      };
    }

    if (existingWallet.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

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

    await dynamoDB.transactWrite(transactionParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Wallet with incomes and expenses deleted' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting wallet', error }),
    };
  }
}

async function getWallet(walletId: string) {
  const params = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Key: {
      id: walletId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();
    return Item;
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
