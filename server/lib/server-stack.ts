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

    // Create a new role for the Lambda function updating user attributes
    const updateUserAttributesRole = new Role(this, 'UpdateUserAttributesRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    //Dynamodb Wallet table definition
    const walletTable = new Table(this, 'WalletTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'WalletsTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    //Dynamodb Income table definition
    const incomeTable = new Table(this, 'IncomeTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'IncomesTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    incomeTable.addGlobalSecondaryIndex({
      indexName: 'walletIdIndex',
      partitionKey: { name: 'walletId', type: AttributeType.STRING },
    });

    //Dynamodb Expense table definition
    const expenseTable = new Table(this, 'ExpenseTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'ExpensesTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    expenseTable.addGlobalSecondaryIndex({
      indexName: 'walletIdIndex',
      partitionKey: { name: 'walletId', type: AttributeType.STRING },
    });

    // CRUD lambdas for wallet
    const createWalletLambda = new NodejsFunction(this, 'CreateWalletLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/walletLambda.ts`),
      handler: "handlerCreate",
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const readWalletLambda = new NodejsFunction(this, 'ReadWalletLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/walletLambda.ts`),
      handler: "handlerRead",
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const updateWalletLambda = new NodejsFunction(this, 'UpdateWalletLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/walletLambda.ts`),
      handler: "handlerUpdate",
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const deleteWalletLambda = new NodejsFunction(this, 'DeleteWalletLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/walletLambda.ts`),
      handler: "handlerDelete",
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
        INCOME_TABLE_NAME: incomeTable.tableName,
        EXPENSE_TABLE_NAME: expenseTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getAllWalletsLambda = new NodejsFunction(this, 'GetAllWalletsLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/walletLambda.ts`),
      handler: 'handlerGetAll',
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole,
    });

    //CRUD lambdas for income
    const createIncomeLambda = new NodejsFunction(this, 'CreateIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: "handlerCreate",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const readIncomeLambda = new NodejsFunction(this, 'ReadIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: "handlerRead",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const updateIncomeLambda = new NodejsFunction(this, 'UpdateIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: "handlerUpdate",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const deleteIncomeLambda = new NodejsFunction(this, 'DeleteIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: "handlerDelete",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getAllIncomesLambda = new NodejsFunction(this, 'GetAllIncomesLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: 'handlerGetAll',
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole,
    });

    //CRUD lambdas for expense
    const createExpenseLambda = new NodejsFunction(this, 'CreateExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: "handlerCreate",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const readExpenseLambda = new NodejsFunction(this, 'ReadExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: "handlerRead",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const updateExpenseLambda = new NodejsFunction(this, 'UpdateExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: "handlerUpdate",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const deleteExpenseLambda = new NodejsFunction(this, 'DeleteExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: "handlerDelete",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getAllExpensesLambda = new NodejsFunction(this, 'GetAllExpensesLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: 'handlerGetAll',
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole,
    });

    // Lambdas for protected and unprotected route
    const getProtectedLambda = new NodejsFunction(this, 'GetProtectedLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/routeLambda.ts`),
      handler: "handlerReadProtected",
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getUnprotectedLambda = new NodejsFunction(this, 'GetUnprotectedLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/routeLambda.ts`),
      handler: "handlerReadUnprotected",
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    // lambda for post sign up
    const updateUserAttributesLambda = new NodejsFunction(this, 'UpdateUserAttributesLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/cognitoLambda.ts`),
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

    // Trigger Lambda after user creation
    cognito.addTrigger(UserPoolOperation.POST_CONFIRMATION, updateUserAttributesLambda);

    // Attach the AWS managed policy to the execution role
    // Permissions for logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents, and cloudwatch:PutMetricData
    lambdaExecutionRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    updateUserAttributesRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    lambdaExecutionRole.addToPolicy(
      new PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
          'dynamodb:Query',
        ],
        resources: [
          walletTable.tableArn,
          incomeTable.tableArn,
          expenseTable.tableArn,
          incomeTable.tableArn + '/index/walletIdIndex',
          expenseTable.tableArn + '/index/walletIdIndex',
        ], // Replace `walletTable` with your DynamoDB table object reference
      })
    );

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

    // API methods for wallets
    const wallets = api.root.addResource('wallets');
    wallets.addMethod('GET', new LambdaIntegration(getAllWalletsLambda),{
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    wallets.addMethod('POST', new LambdaIntegration(createWalletLambda),{
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });

    const singleWallet = wallets.addResource('{walletId}');
    singleWallet.addMethod('GET', new LambdaIntegration(readWalletLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    singleWallet.addMethod('PUT', new LambdaIntegration(updateWalletLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    singleWallet.addMethod('DELETE', new LambdaIntegration(deleteWalletLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });

    const incomes = singleWallet.addResource('incomes');
    incomes.addMethod('GET', new LambdaIntegration(getAllIncomesLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    incomes.addMethod('POST', new LambdaIntegration(createIncomeLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });

    const singleIncome = incomes.addResource('{incomeId}');
    singleIncome.addMethod('GET', new LambdaIntegration(readIncomeLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    singleIncome.addMethod('PUT', new LambdaIntegration(updateIncomeLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    singleIncome.addMethod('DELETE', new LambdaIntegration(deleteIncomeLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });

    const expenses = singleWallet.addResource('expenses');
    expenses.addMethod('GET', new LambdaIntegration(getAllExpensesLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    expenses.addMethod('POST', new LambdaIntegration(createExpenseLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });

    const singleExpense = expenses.addResource('{expenseId}');
    singleExpense.addMethod('GET', new LambdaIntegration(readExpenseLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    singleExpense.addMethod('PUT', new LambdaIntegration(updateExpenseLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    singleExpense.addMethod('DELETE', new LambdaIntegration(deleteExpenseLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
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

// import { App } from 'aws-cdk-lib';
// import { CognitoStack } from './cognito-stack';
// import { WalletStack } from './wallet-stack';
// import { IncomeStack } from './income-stack';
// import { ExpenseStack } from './expense-stack';
// import { UnprotectedStack } from './unprotected-stack';
//
// const app = new App();
//
// // Instantiate the cognito stack
// const cognitoStack = new CognitoStack(app, 'CognitoStack');
//
// // Pass the user pool, the api, and the authorizer as props to the other stacks
// const walletStack = new WalletStack(app, 'WalletStack', { cognito: cognitoStack.cognito, api: cognitoStack.api, authorizer: cognitoStack.authorizer });
// const incomeStack = new IncomeStack(app, 'IncomeStack', { cognito: cognitoStack.cognito, api: cognitoStack.api, authorizer: cognitoStack.authorizer });
// const expenseStack = new ExpenseStack(app, 'ExpenseStack', { cognito: cognitoStack.cognito, api: cognitoStack.api, authorizer: cognitoStack.authorizer });
// const unprotectedStack = new UnprotectedStack(app, 'UnprotectedStack', { api: cognitoStack.api, authorizer: cognitoStack.authorizer });