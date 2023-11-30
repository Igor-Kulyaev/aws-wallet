import { Construct } from 'constructs';
import {Stack, StackProps, CfnOutput, RemovalPolicy} from 'aws-cdk-lib';

import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import {Runtime, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import * as path from 'path';
import {LambdaIntegration, RestApi, Cors} from "aws-cdk-lib/aws-apigateway";
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {AccountRecovery, OAuthScope, UserPool, UserPoolClient} from "aws-cdk-lib/aws-cognito";

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
      entry: path.join(__dirname, `/../functions/function.ts`),
      handler: "handlerCreate",
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const readWalletLambda = new NodejsFunction(this, 'ReadWalletLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/function.ts`),
      handler: "handlerRead",
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const updateWalletLambda = new NodejsFunction(this, 'UpdateWalletLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/function.ts`),
      handler: "handlerUpdate",
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const deleteWalletLambda = new NodejsFunction(this, 'DeleteWalletLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/function.ts`),
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
      entry: path.join(__dirname, `/../functions/function.ts`),
      handler: 'handlerGetAll',
      environment: {
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole,
    });

    //CRUD lambdas for income
    const createIncomeLambda = new NodejsFunction(this, 'CreateIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/income.ts`),
      handler: "handlerCreate",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const readIncomeLambda = new NodejsFunction(this, 'ReadIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/income.ts`),
      handler: "handlerRead",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const updateIncomeLambda = new NodejsFunction(this, 'UpdateIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/income.ts`),
      handler: "handlerUpdate",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const deleteIncomeLambda = new NodejsFunction(this, 'DeleteIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/income.ts`),
      handler: "handlerDelete",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getAllIncomesLambda = new NodejsFunction(this, 'GetAllIncomesLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/income.ts`),
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
      entry: path.join(__dirname, `/../functions/expense.ts`),
      handler: "handlerCreate",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const readExpenseLambda = new NodejsFunction(this, 'ReadExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/expense.ts`),
      handler: "handlerRead",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const updateExpenseLambda = new NodejsFunction(this, 'UpdateExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/expense.ts`),
      handler: "handlerUpdate",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const deleteExpenseLambda = new NodejsFunction(this, 'DeleteExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/expense.ts`),
      handler: "handlerDelete",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
        WALLET_TABLE_NAME: walletTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getAllExpensesLambda = new NodejsFunction(this, 'GetAllExpensesLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../functions/expense.ts`),
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

    // Attach the AWS managed policy to the execution role
    // Permissions for logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents, and cloudwatch:PutMetricData
    lambdaExecutionRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    lambdaExecutionRole.addToPolicy(
      new PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
          'dynamodb:Query'
        ],
        resources: [
          walletTable.tableArn,
          incomeTable.tableArn,
          expenseTable.tableArn,
          incomeTable.tableArn + '/index/walletIdIndex',
          expenseTable.tableArn + '/index/walletIdIndex'
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

    // API methods for wallets
    const wallets = api.root.addResource('wallets');
    wallets.addMethod('GET', new LambdaIntegration(getAllWalletsLambda));
    wallets.addMethod('POST', new LambdaIntegration(createWalletLambda));

    const singleWallet = wallets.addResource('{walletId}');
    singleWallet.addMethod('GET', new LambdaIntegration(readWalletLambda));
    singleWallet.addMethod('PUT', new LambdaIntegration(updateWalletLambda));
    singleWallet.addMethod('DELETE', new LambdaIntegration(deleteWalletLambda));

    const incomes = singleWallet.addResource('incomes');
    incomes.addMethod('GET', new LambdaIntegration(getAllIncomesLambda));
    incomes.addMethod('POST', new LambdaIntegration(createIncomeLambda));

    const singleIncome = incomes.addResource('{incomeId}');
    singleIncome.addMethod('GET', new LambdaIntegration(readIncomeLambda));
    singleIncome.addMethod('PUT', new LambdaIntegration(updateIncomeLambda));
    singleIncome.addMethod('DELETE', new LambdaIntegration(deleteIncomeLambda));

    const expenses = singleWallet.addResource('expenses');
    expenses.addMethod('GET', new LambdaIntegration(getAllExpensesLambda));
    expenses.addMethod('POST', new LambdaIntegration(createExpenseLambda));

    const singleExpense = expenses.addResource('{expenseId}');
    singleExpense.addMethod('GET', new LambdaIntegration(readExpenseLambda));
    singleExpense.addMethod('PUT', new LambdaIntegration(updateExpenseLambda));
    singleExpense.addMethod('DELETE', new LambdaIntegration(deleteExpenseLambda));

    const protectedRoute = api.root.addResource('protected');
    protectedRoute.addMethod('GET', new LambdaIntegration(getProtectedLambda));

    const unprotectedRoute = api.root.addResource('unprotected');
    unprotectedRoute.addMethod('GET', new LambdaIntegration(getUnprotectedLambda));


  }
}
