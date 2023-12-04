import { Construct } from 'constructs';
import {Stack, StackProps, CfnOutput, RemovalPolicy, Lazy} from 'aws-cdk-lib';

import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import {Runtime, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import * as path from 'path';
import {LambdaIntegration, RestApi, Cors, CfnAuthorizer, AuthorizationType} from "aws-cdk-lib/aws-apigateway";
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
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

export class ServerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cognito = new UserPool(this, "WalletUserPool", {
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

    const userPoolClient = new UserPoolClient(this, "WalletClient", {
      userPool: cognito,
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

    new CfnOutput(this, "UserPoolId", {
      value: cognito.userPoolId || "",
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId || "",
    });

    // Create an execution role for the Lambda functions
    const lambdaExecutionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    // Lambdas for protected and unprotected route
    const getProtectedLambda = new NodejsFunction(this, 'GetProtectedLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/route.ts`),
      handler: "handlerReadProtected",
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getUnprotectedLambda = new NodejsFunction(this, 'GetUnprotectedLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/route.ts`),
      handler: "handlerReadUnprotected",
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    // lambda for pre signup
    const preSignUpFn = new NodejsFunction(this, 'PreSignUpFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/cognito.ts`),
      handler: "handlerSignup",
      role: lambdaExecutionRole,
    });

    // Create a new role for the Lambda function updating user attributes
    const updateUserAttributesRole = new Role(this, 'UpdateUserAttributesRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    // lambda for post sign up
    const updateUserAttributesLambda = new NodejsFunction(this, 'UpdateUserAttributesLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/cognito.ts`),
      handler: 'handlerPostSignup', // Implement your handler function
      role: updateUserAttributesRole,
    });

    // Grant necessary permissions to the role
    // To avoid circular dependency, first create and deploy user pool after that, add policy for updating user account
    updateUserAttributesRole.addToPolicy(
      new PolicyStatement({
        actions: ['cognito-idp:AdminUpdateUserAttributes'],
        resources: [process.env.USER_POOL_ARN as string], // Replace with your Cognito User Pool ARN
      })
    );

    cognito.addTrigger(UserPoolOperation.PRE_SIGN_UP, preSignUpFn);
    // Trigger Lambda after user creation
    cognito.addTrigger(UserPoolOperation.POST_CONFIRMATION, updateUserAttributesLambda);

    // Attach the AWS managed policy to the execution role
    // Permissions for logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents, and cloudwatch:PutMetricData
    lambdaExecutionRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    updateUserAttributesRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    const api = new RestApi(this, 'WalletsAPI', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // For testing purposes, allowing all origins
        allowMethods: Cors.ALL_METHODS, // All HTTP methods (GET, POST, PUT, DELETE, etc.)
        allowHeaders: ['*'], // Allow any headers in the request
      },
    });

    // Create Cognito authorizer
    const authorizer = new CfnAuthorizer(this, 'CognitoAuthorizer', {
      restApiId: api.restApiId,
      name: 'CognitoAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [cognito.userPoolArn],
    });

    const protectedRoute = api.root.addResource('protected');
    protectedRoute.addMethod('GET', new LambdaIntegration(getProtectedLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });

    const unprotectedRoute = api.root.addResource('unprotected');
    unprotectedRoute.addMethod('GET', new LambdaIntegration(getUnprotectedLambda));


  }
}