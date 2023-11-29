import { Handler, APIGatewayEvent } from 'aws-lambda';

export async function handlerReadProtected(event: APIGatewayEvent) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Protected route"
    }),
  };
}

export async function handlerReadUnprotected(event: APIGatewayEvent) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Unprotected route"
    }),
  };
}