import { Handler, APIGatewayEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export async function handlerCreate(event: APIGatewayEvent) {
  const walletId = event.pathParameters?.walletId;

  // TODO check that wallet exists and wallet pertains to user

  // Parse event.body to get wallet data
  const incomeData = JSON.parse(event.body || '');

  // Generate timestamp for createdAt and updatedAt fields
  const timestamp = new Date().toISOString();
  const id = Math.floor(Math.random() * 1000000).toString(); // Generate a random whole number as ID
  const incomeItem = {
    ...incomeData,
    id: id, // Generate a random ID (replace with UUID or your ID generation logic)
    walletId: walletId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const params = {
    TableName: process.env.INCOME_TABLE_NAME || '',
    Item: incomeItem,
  };

  try {
    await dynamoDB.put(params).promise();
    // TODO update current balance of wallet
    // TODO add transaction
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

// Implement other handlers similarly for read, update, and delete operations
export async function handlerRead(event: APIGatewayEvent) {
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

    // TODO check that income pertains to wallet and user

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Income not found' }),
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
  const walletId = event.pathParameters?.walletId;

  // TODO check that wallet exists and wallet pertains to user

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

  try {
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

  const incomeData = JSON.parse(event.body || '');

  const timestamp = new Date().toISOString();
  const params = {
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

  try {
    // TODO check that income exists and pertains to wallet and user
    const existingIncome = await getIncome(incomeId); // Function to check if wallet exists

    if (!existingIncome) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Income not found' }),
      };
    }

    const { Attributes } = await dynamoDB.update(params).promise();

    if (!Attributes) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Income not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(Attributes),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating income', error }),
    };
  }
}

export async function handlerDelete(event: APIGatewayEvent) {
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
    // TODO check that income exists and pertains to wallet and user
    const existingIncome = await getIncome(incomeId); // Function to check if wallet exists

    if (!existingIncome) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Income not found' }),
      };
    }

    const params = {
      TableName: process.env.INCOME_TABLE_NAME || '',
      Key: {
        id: incomeId,
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
