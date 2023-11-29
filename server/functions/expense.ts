import { Handler, APIGatewayEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export async function handlerCreate(event: APIGatewayEvent) {
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

    // TODO check that wallet pertains to user

    // Parse event.body to get expense data
    const expenseData = JSON.parse(event.body || '');

    // Generate timestamp for createdAt and updatedAt fields
    const expenseTimestamp = new Date().toISOString();
    const id = Math.floor(Math.random() * 1000000).toString(); // Generate a random whole number as ID
    const expenseItem = {
      ...expenseData,
      id: id, // Generate a random ID (replace with UUID or your ID generation logic)
      walletId: walletId,
      createdAt: expenseTimestamp,
      updatedAt: expenseTimestamp,
    };

    const expenseParams = {
      TableName: process.env.EXPENSE_TABLE_NAME || '',
      Item: expenseItem,
    };

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
          Update: updateWalletParams,
        },
      ],
    };

    await dynamoDB.transactWrite(transactionParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(expenseItem),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating expense', error }),
    };
  }
}

export async function handlerRead(event: APIGatewayEvent) {
  const walletId = event.pathParameters?.walletId;
  const expenseId = event.pathParameters?.expenseId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  if (!expenseId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Expense ID is missing in the request' }),
    };
  }

  const params = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    Key: {
      id: expenseId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    if (Item.walletId !== walletId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Expense does not pertain to requested wallet' }),
      };
    }

    // TODO check that expense pertains to user

    return {
      statusCode: 200,
      body: JSON.stringify(Item),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error reading expense', error }),
    };
  }
}

export const handlerGetAll: Handler = async (event: APIGatewayEvent) => {
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

    // TODO check that wallet pertains to user

    const params = {
      TableName: process.env.EXPENSE_TABLE_NAME || '',
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
      body: JSON.stringify({ message: 'Error fetching expenses', error }),
    };
  }
};

export async function handlerUpdate(event: APIGatewayEvent) {
  const walletId = event.pathParameters?.walletId;
  const expenseId = event.pathParameters?.expenseId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  if (!expenseId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Expense ID is missing in the request' }),
    };
  }

  try {
    const existingExpense = await getExpense(expenseId); // Function to check if expense exists

    if (!existingExpense) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    if (existingExpense.walletId !== walletId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Expense does not pertain to requested wallet' }),
      };
    }

    // TODO check that expense pertains to user

    const expenseData = JSON.parse(event.body || '');

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

    await dynamoDB.transactWrite(transactionParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...existingExpense,
        name: expenseData.name,
        type: expenseData.type,
        amount: expenseData.amount,
        updatedAt: timestamp
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating expense', error }),
    };
  }
}

export async function handlerDelete(event: APIGatewayEvent) {
  const walletId = event.pathParameters?.walletId;
  const expenseId = event.pathParameters?.expenseId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Expense ID is missing in the request' }),
    };
  }

  if (!expenseId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Expense ID is missing in the request' }),
    };
  }

  try {
    const existingExpense = await getExpense(expenseId); // Function to check if expense exists

    if (!existingExpense) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    if (existingExpense.walletId !== walletId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Expense does not pertain to requested wallet' }),
      };
    }

    // TODO check that expense pertains to user

    const expenseParams = {
      TableName: process.env.EXPENSE_TABLE_NAME || '',
      Key: {
        id: expenseId,
      },
    };

    const timestamp = new Date().toISOString();

    // await dynamoDB.delete(expenseParams).promise();

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
          Update: updateWalletParams,
        },
      ],
    };

    await dynamoDB.transactWrite(transactionParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Expense deleted' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting expense', error }),
    };
  }
}

async function getExpense(expenseId: string) {
  const params = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    Key: {
      id: expenseId,
    },
  };

  try {
    const { Item } = await dynamoDB.get(params).promise();
    return Item;
  } catch (error) {
    throw error;
  }
}
