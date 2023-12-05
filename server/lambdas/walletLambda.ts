import { Handler, APIGatewayEvent } from 'aws-lambda';
import {decodeToken} from "../utils/utils";
import {createWallet, deleteWallet, getWallet, getWallets, updateWallet} from "../services/walletService";

export async function handlerCreate(event: APIGatewayEvent) {
  const decodedToken = decodeToken(event);
  const userId = decodedToken.sub;
  const walletData = JSON.parse(event.body || '');

  try {
    const walletItem = await createWallet(walletData, userId!);
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

export async function handlerRead(event: APIGatewayEvent) {
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

    return {
      statusCode: 200,
      body: JSON.stringify(wallet),
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
  const userId = decodedToken.sub;

  try {
    const wallets = await getWallets(userId!);

    return {
      statusCode: 200,
      body: JSON.stringify(wallets),
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
  const userId = decodedToken.sub;
  const walletId = event.pathParameters?.walletId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  try {
    const existingWallet = await getWallet(walletId);

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
    const updatedWallet = await updateWallet(walletData, existingWallet, walletId);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedWallet),
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
  const userId = decodedToken.sub;
  const walletId = event.pathParameters?.walletId;

  if (!walletId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Wallet ID is missing in the request' }),
    };
  }

  try {
    const existingWallet = await getWallet(walletId);

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

    await deleteWallet(walletId);

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
