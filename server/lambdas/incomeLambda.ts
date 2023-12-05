import { Handler, APIGatewayEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import {decodeToken} from "../utils/utils";

const dynamoDB = new DynamoDB.DocumentClient();

export async function handlerCreate(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub; // Example: extracting the user ID

  const walletId = event.pathParameters?.walletId;

  try {
    const walletParams = {
      TableName: process.env.WALLET_TABLE_NAME || '',
      Key: {
        id: walletId,
      },
    };
    const { Item: wallet } = await dynamoDB.get(walletParams).promise();

    if (!wallet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Wallet not found' }),
      };
    }

    if (wallet.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    // Parse event.body to get income data
    const incomeData = JSON.parse(event.body || '');

    // Generate timestamp for createdAt and updatedAt fields
    const incomeTimestamp = new Date().toISOString();
    const id = Math.floor(Math.random() * 1000000).toString(); // Generate a random whole number as ID
    const incomeItem = {
      ...incomeData,
      id: id, // Generate a random ID (replace with UUID or your ID generation logic)
      walletId: walletId,
      userId: userId,
      createdAt: incomeTimestamp,
      updatedAt: incomeTimestamp,
    };

    const incomeParams = {
      TableName: process.env.INCOME_TABLE_NAME || '',
      Item: incomeItem,
    };

    const updateWalletParams = {
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
          Update: updateWalletParams,
        },
      ],
    };

    await dynamoDB.transactWrite(transactionParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(incomeItem),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating income', error }),
    };
  }
}

export async function handlerRead(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub; // Example: extracting the user ID

  const walletId = event.pathParameters?.walletId;
  const incomeId = event.pathParameters?.incomeId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  if (!incomeId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Income ID is missing in the request' }),
    };
  }

  const params = {
    TableName: process.env.INCOME_TABLE_NAME || '',
    Key: {
      id: incomeId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Income not found' }),
      };
    }

    if (Item.walletId !== walletId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Income does not pertain to requested wallet' }),
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
      body: JSON.stringify({ message: 'Error reading income', error }),
    };
  }
}

export const handlerGetAll: Handler = async (event: APIGatewayEvent) => {
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
    const walletParams = {
      TableName: process.env.WALLET_TABLE_NAME || '',
      Key: {
        id: walletId,
      },
    };
    const { Item: wallet } = await dynamoDB.get(walletParams).promise();

    if (!wallet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Wallet not found' }),
      };
    }

    if (wallet.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const params = {
      TableName: process.env.INCOME_TABLE_NAME || '',
      FilterExpression: '#walletId = :walletId', // Filter expression to match walletId
      ExpressionAttributeNames: {
        '#walletId': 'walletId', // Replace 'walletId' with the actual attribute name in your table
      },
      ExpressionAttributeValues: {
        ':walletId': walletId, // Value to match with the provided walletId from the URL path
      },
    };

    const { Items } = await dynamoDB.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching incomes', error }),
    };
  }
};

export async function handlerUpdate(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub; // Example: extracting the user ID

  const walletId = event.pathParameters?.walletId;
  const incomeId = event.pathParameters?.incomeId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  if (!incomeId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Income ID is missing in the request' }),
    };
  }

  try {
    const existingIncome = await getIncome(incomeId); // Function to check if income exists

    if (!existingIncome) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Income not found' }),
      };
    }

    if (existingIncome.walletId !== walletId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Income does not pertain to requested wallet' }),
      };
    }

    if (existingIncome.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const incomeData = JSON.parse(event.body || '');

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
          Update: incomeParams,
        },
        {
          Update: updateWalletParams,
        },
      ],
    };

    await dynamoDB.transactWrite(transactionParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...existingIncome,
        name: incomeData.name,
        type: incomeData.type,
        amount: incomeData.amount,
        updatedAt: timestamp
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating income', error }),
    };
  }
}

export async function handlerDelete(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub; // Example: extracting the user ID

  const walletId = event.pathParameters?.walletId;
  const incomeId = event.pathParameters?.incomeId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  if (!incomeId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Income ID is missing in the request' }),
    };
  }

  try {
    const existingIncome = await getIncome(incomeId); // Function to check if income exists

    if (!existingIncome) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Income not found' }),
      };
    }

    if (existingIncome.walletId !== walletId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Income does not pertain to requested wallet' }),
      };
    }

    if (existingIncome.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const incomeParams = {
      TableName: process.env.INCOME_TABLE_NAME || '',
      Key: {
        id: incomeId,
      },
    };

    const timestamp = new Date().toISOString();

    // await dynamoDB.delete(incomeParams).promise();

    const updateWalletParams = {
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
          Update: updateWalletParams,
        },
      ],
    };

    await dynamoDB.transactWrite(transactionParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Income deleted' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting income', error }),
    };
  }
}

async function getIncome(incomeId: string) {
  const params = {
    TableName: process.env.INCOME_TABLE_NAME || '',
    Key: {
      id: incomeId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();
    return Item;
  } catch (error) {
    throw error;
  }
}
