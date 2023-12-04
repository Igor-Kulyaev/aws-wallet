import {CfnOutput} from "aws-cdk-lib";
import {CognitoIdentityServiceProvider} from "aws-sdk";

// @ts-ignore
export async function handlerSignup (event) {
  // event.response.autoConfirmUser = false;
  // event.request.userAttributes['custom:role'] = 'USER'; // Add role attribute
  event.request.userAttributes.given_name = 'Andrey';
  event.request.validationData = {
    ...event.request.userAttributes,
    given_name: 'Andrey',
  };
  console.log('EVENT IN LAMBDA', event);

  // Return to Amazon Cognito
  return event;
}

// @ts-ignore
export async function handlerPostSignup(event) {
  console.log('EVENT IN POST SIGN UP', event);
  const cognitoISP = new CognitoIdentityServiceProvider();

  const params = {
    UserAttributes: [
      {
        Name: 'custom:role',
        Value: 'USER',
      },
    ],
    UserPoolId: event.userPoolId,
    Username: event.userName
  };

  try {
    await cognitoISP.adminUpdateUserAttributes(params).promise();
    console.log(`Added 'custom:role' attribute to user ${event.userName}`);
    return event;

  } catch (error) {
    console.error('Error adding attribute:', error);
    throw error;
  }
}
