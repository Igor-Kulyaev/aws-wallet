import { Handler, APIGatewayEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export async function handlerCreate(event: APIGatewayEvent) {
  const walletId = event.pathParameters?.walletId;

  // TODO check that wallet exists and wallet pertains to user

  // Parse event.body to get expense data
  const expenseData = JSON.parse(event.body || '');

  // Generate timestamp for createdAt and updatedAt fields
  const timestamp = new Date().toISOString();
  const id = Math.floor(Math.random() * 1000000).toString(); // Generate a random whole number as ID
  const expenseItem = {
    ...expenseData,
    id: id, // Generate a random ID (replace with UUID or your ID generation logic)
    walletId: walletId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const params = {
    TableName: process.env.EXPENSE_TABLE_NAME || '',
    Item: expenseItem,
  };

  try {
    await dynamoDB.put(params).promise();
    // TODO update current balance of wallet
    // TODO add transaction
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

// Implement other handlers similarly for read, update, and delete operations
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

    // TODO check that expense pertains to wallet and user

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

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

  // TODO check that wallet exists and wallet pertains to user

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

  try {
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

  const incomeData = JSON.parse(event.body || '');

  const timestamp = new Date().toISOString();
  const params = {
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
      ':name': incomeData.name,
      ':type': incomeData.type,
      ':amount': incomeData.amount,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  try {
    // TODO check that expense exists and pertains to wallet and user
    const existingExpense = await getExpense(expenseId); // Function to check if expense exists

    if (!existingExpense) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    const { Attributes } = await dynamoDB.update(params).promise();

    if (!Attributes) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(Attributes),
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
    // TODO check that expense exists and pertains to wallet and user
    const existingExpense = await getExpense(expenseId); // Function to check if expense exists

    if (!existingExpense) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    const params = {
      TableName: process.env.EXPENSE_TABLE_NAME || '',
      Key: {
        id: expenseId,
      },
    };

    await dynamoDB.delete(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Deleted' }),
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
