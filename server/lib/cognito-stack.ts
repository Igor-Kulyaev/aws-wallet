import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import {LambdaIntegration, RestApi, Cors, CfnAuthorizer, AuthorizationType} from "aws-cdk-lib/aws-apigateway";

import {
  AccountRecovery,
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolClient,
  UserPoolOperation
} from "aws-cdk-lib/aws-cognito";

import * as dotenv from 'dotenv';
dotenv.config();

// Define a class for the cognito stack
export class CognitoStack extends Stack {
  // Declare the user pool, the api, and the authorizer as public properties
  public readonly cognito: UserPool;
  public readonly api: RestApi;
  public readonly authorizer: CfnAuthorizer;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a new user pool
    this.cognito = new UserPool(this, "WalletUserPool", {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      standardAttributes: {
        email: {
          required: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
        birthdate: {
          required: true,
          mutable: true,
        }
      },
      customAttributes: {
        role: new StringAttribute({mutable: true}),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create a new user pool client
    const userPoolClient = new UserPoolClient(this, "WalletClient", {
      userPool: this.cognito,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: ["http://localhost:3000"],
      },
    });

    // Output the user pool id and client id
    new CfnOutput(this, "UserPoolId", {
      value: this.cognito.userPoolId || "",
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId || "",
    });

    // Create a new RestApi
    this.api = new RestApi(this, 'WalletsAPI', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // For testing purposes, allowing all origins
        allowMethods: Cors.ALL_METHODS, // All HTTP methods (GET, POST, PUT, DELETE, etc.)
        allowHeaders: ['*'], // Allow any headers in the request
      },
    });

    // Create a new Cognito authorizer
    this.authorizer = new CfnAuthorizer(this, 'CognitoAuthorizer', {
      restApiId: this.api.restApiId,
      name: 'CognitoAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [this.cognito.userPoolArn],
    });
  }
}