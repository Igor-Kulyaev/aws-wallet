import {APIGatewayEvent} from "aws-lambda";
import * as jwt from 'jsonwebtoken';
import {JwtPayload} from "jsonwebtoken"; // Make sure to install 'jsonwebtoken' package

export const decodeToken = (event: APIGatewayEvent) => {
  // Extract the JWT token from the Authorization header
  const token = (event.headers.Authorization as string).split(' ')[1]; // Assuming "Bearer <token>"

  // Validate and decode the token to access user data
  const decodedToken = jwt.decode(token);

  return decodedToken as JwtPayload;
}