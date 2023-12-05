import { Handler, APIGatewayEvent } from 'aws-lambda';
import {decodeToken} from "../utils/utils";
import {getWallet} from "../services/walletService";
import {createExpense, deleteExpense, getExpense, getExpenses, updateExpense} from "../services/expenseService";

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

    const expenseData = JSON.parse(event.body || '');

    const createdExpense = await createExpense(walletId!, userId, expenseData);

    return {
      statusCode: 200,
      body: JSON.stringify(createdExpense),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating expense', error }),
    };
  }
}

export async function handlerRead(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub;
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
    const expense = await getExpense(expenseId);

    if (!expense) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    if (expense.walletId !== walletId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Expense does not pertain to requested wallet' }),
      };
    }

    if (expense.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(expense),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error reading expense', error }),
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
    const wallet = await getWallet(walletId);

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

    const expenses = await getExpenses(walletId);

    return {
      statusCode: 200,
      body: JSON.stringify(expenses),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching expenses', error }),
    };
  }
};

export async function handlerUpdate(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub;
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
    const existingExpense = await getExpense(expenseId);

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

    if (existingExpense.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const expenseData = JSON.parse(event.body || '');

    const updatedExpense = await updateExpense(expenseId, walletId, expenseData, existingExpense);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedExpense),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating expense', error }),
    };
  }
}

export async function handlerDelete(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub;
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
    const existingExpense = await getExpense(expenseId);

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

    if (existingExpense.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    await deleteExpense(expenseId, walletId, existingExpense);

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
