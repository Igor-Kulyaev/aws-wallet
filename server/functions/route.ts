import { Handler, APIGatewayEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken'; // Make sure to install 'jsonwebtoken' package

export async function handlerReadProtected(event: APIGatewayEvent) {
  try {
    // Extract the JWT token from the Authorization header
    // @ts-ignore
    const token = event.headers.Authorization.split(' ')[1]; // Assuming "Bearer <token>"

    // Validate and decode the token to access user data
    const decodedToken = jwt.decode(token);

    if (!decodedToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid token' }),
      };
    }

    // Access the user ID, attributes, or any other necessary user data from the decoded token
    const userId = decodedToken.sub; // Example: extracting the user ID
    // @ts-ignore
    const userAttributes = decodedToken['custom:my_custom_attribute']; // Replace with your attribute name

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Protected route',
        userId,
        userAttributes,
        decodedToken, // This includes all decoded token information, helpful for debugging
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
  // return {
  //   statusCode: 200,
  //   body: JSON.stringify({
  //     message: "Protected route"
  //   }),
  // };
}

export async function handlerReadUnprotected(event: APIGatewayEvent) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Unprotected route"
    }),
  };
}