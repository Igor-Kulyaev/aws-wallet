import {jwtDecode} from "jwt-decode";

export const getIdToken = (userId: string) => {
  const idKey = `CognitoIdentityServiceProvider.${process.env.REACT_APP_USER_POOL_APP_CLIENT_ID}.${userId}.idToken`;
  const idToken = localStorage.getItem(idKey);
  return idToken;
}

export const decodeJwtToken = (token: string) => {
  try {
    const decoded = jwtDecode(token);

    return decoded as Record<string, string>;
  } catch (error) {
    return null;
  }
}
