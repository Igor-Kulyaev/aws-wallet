import { Handler, APIGatewayEvent } from 'aws-lambda';

import { DynamoDB } from 'aws-sdk';

// const dynamo = new DynamoDB.DocumentClient();
// const TABLE_NAME : string = process.env.HELLO_TABLE_NAME!;

const dynamoDB = new DynamoDB.DocumentClient();

export async function handlerCreate(event: APIGatewayEvent) {
  // Implement logic to create a wallet in DynamoDB based on event.body
  // Parse event.body to get wallet data
  const walletData = JSON.parse(event.body || '');

  // Generate timestamp for createdAt and updatedAt fields
  const timestamp = new Date().toISOString();
  const id = Math.floor(Math.random() * 1000000).toString(); // Generate a random whole number as ID
  const walletItem = {
    ...walletData,
    currentBalance: walletData.startingBalance,
    id: id, // Generate a random ID (replace with UUID or your ID generation logic)
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

// Implement other handlers similarly for read, update, and delete operations
export async function handlerRead(event: APIGatewayEvent) {
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

export const handlerGetAll: Handler = async () => {
  const params = {
    TableName: process.env.WALLET_TABLE_NAME || '',
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
      body: JSON.stringify({ message: 'Error fetching wallets', error }),
    };
  }
};

export async function handlerUpdate(event: APIGatewayEvent) {
  const walletId = event.pathParameters?.walletId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  const walletData = JSON.parse(event.body || '');

  const timestamp = new Date().toISOString();
  const params = {
    TableName: process.env.WALLET_TABLE_NAME || '',
    Key: {
      id: walletId,
    },
    UpdateExpression: 'set #name = :name, #description = :description, #startingBalance = :startingBalance, #currentBalance = :currentBalance, #updatedAt = :updatedAt',
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
      ':currentBalance': walletData.currentBalance,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  try {
    const existingWallet = await getWallet(walletId); // Function to check if wallet exists

    if (!existingWallet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Wallet not found' }),
      };
    }

    const { Attributes } = await dynamoDB.update(params).promise();

    if (!Attributes) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Wallet not found' }),
      };
    }

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

    const params = {
      TableName: process.env.WALLET_TABLE_NAME || '',
      Key: {
        id: walletId,
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

// export const handler: Handler = async (event, context) => {
//
//   const method = event.requestContext.http.method;
//
//   if (method === 'GET') {
//     return await getHello(event)
//   } else if (method === 'POST') {
//     return await save(event);
//   } else {
//     return {
//       statusCode: 400,
//       body: 'Not a valid operation'
//     };
//   }
// };
//
// async function save(event : any) {
//   const name = event.queryStringParameters.name;
//
//   const item = {
//     name: name,
//     date: Date.now(),
//   };
//
//   console.log(item);
//   const savedItem = await saveItem(item);
//
//   return {
//     statusCode: 200,
//     body: JSON.stringify(savedItem),
//   };
// };
//
// async function getHello(event : any ) {
//   const name = event.queryStringParameters.name;
//
//   const item = await getItem(name);
//
//   if (item !== undefined && item.date) {
//     const d = new Date(item.date);
//
//     const message = `Was greeted on ${d.getDate()}/${
//       d.getMonth() + 1
//     }/${d.getFullYear()}`;
//
//     return {
//       statusCode: 200,
//       body: JSON.stringify(message),
//     };
//
//   } else {
//
//     const message = "Nobody was greeted with that name";
//     return {
//       statusCode: 200,
//       body: JSON.stringify(message),
//     };
//   }
// };
//
// async function getItem(name : string ) {
//
//   const params : DynamoDB.DocumentClient.GetItemInput = {
//     Key: {
//       name: name,
//     },
//     TableName: TABLE_NAME,
//   };
//
//   return dynamo
//     .get(params)
//     .promise()
//     .then((result) => {
//       console.log(result);
//       return result.Item;
//     });
// }
//
// async function saveItem(item : any) {
//
//   const params : DynamoDB.DocumentClient.PutItemInput = {
//     TableName: TABLE_NAME,
//     Item: item,
//   };
//
//   return dynamo
//     .put(params)
//     .promise()
//     .then(() => {
//       return item;
//     });
// }
