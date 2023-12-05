import { Handler, APIGatewayEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import {decodeToken} from "../utils/utils";
import {createIncome, deleteIncome, getIncome, getIncomes, updateIncome} from "../services/incomeService";
import {getWallet} from "../services/walletService";

export async function handlerCreate(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub;
  const walletId = event.pathParameters?.walletId;

  try {
    const wallet = await getWallet(walletId as string);

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

    const incomeData = JSON.parse(event.body || '');

    const createdIncome = await createIncome(incomeData, walletId as string, userId);

    return {
      statusCode: 200,
      body: JSON.stringify(createdIncome),
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
  const userId = decodedToken.sub;
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
    const income = await getIncome(incomeId);

    if (!income) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Income not found' }),
      };
    }

    if (income.walletId !== walletId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Income does not pertain to requested wallet' }),
      };
    }

    if (income.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(income),
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
  const userId = decodedToken.sub;
  const walletId = event.pathParameters?.walletId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  try {
    const wallet = await getWallet(walletId as string);

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

    const incomes = await getIncomes(walletId);

    return {
      statusCode: 200,
      body: JSON.stringify(incomes),
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
  const userId = decodedToken.sub;
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
    const existingIncome = await getIncome(incomeId);

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

    const updatedIncome = await updateIncome(incomeId, walletId, incomeData, existingIncome);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedIncome),
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
  const userId = decodedToken.sub;
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
    const existingIncome = await getIncome(incomeId);

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

    await deleteIncome(incomeId, walletId, existingIncome);

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
