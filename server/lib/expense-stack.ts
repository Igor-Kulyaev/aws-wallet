import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput, RemovalPolicy, Lazy } from 'aws-cdk-lib';

import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from 'path';
import { LambdaIntegration, RestApi, Cors, CfnAuthorizer, AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  AccountRecovery,
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolClient,
  UserPoolOperation
} from "aws-cdk-lib/aws-cognito";

// Use the same interface for the common props that will be passed to the other stacks
interface CommonProps extends StackProps {
  cognito: UserPool;
  api: RestApi;
  authorizer: CfnAuthorizer;
}

// Define a class for the expense stack
export class ExpenseStack extends Stack {
  constructor(scope: Construct, id: string, props: CommonProps) {
    super(scope, id, props);

    // Get the common resources from the props
    const { cognito, api, authorizer } = props;

    // Create a new role for the Lambda functions
    const lambdaExecutionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    // Attach the AWS managed policy to the execution role
    // Permissions for logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents, and cloudwatch:PutMetricData
    lambdaExecutionRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    //Dynamodb Expense table definition
    const expenseTable = new Table(this, 'ExpenseTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'ExpensesTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Add a global secondary index for the walletId attribute
    expenseTable.addGlobalSecondaryIndex({
      indexName: 'walletIdIndex',
      partitionKey: { name: 'walletId', type: AttributeType.STRING },
    });

    // Grant the Lambda execution role permissions to access the expense table
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
          expenseTable.tableArn,
          expenseTable.tableArn + '/index/walletIdIndex',
        ],
      })
    );

    // CRUD lambdas for expense
    const createExpenseLambda = new NodejsFunction(this, 'CreateExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: "handlerCreate",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const readExpenseLambda = new NodejsFunction(this, 'ReadExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: "handlerRead",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const updateExpenseLambda = new NodejsFunction(this, 'UpdateExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: "handlerUpdate",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const deleteExpenseLambda = new NodejsFunction(this, 'DeleteExpenseLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: "handlerDelete",
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getAllExpensesLambda = new NodejsFunction(this, 'GetAllExpensesLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/expenseLambda.ts`),
      handler: 'handlerGetAll',
      environment: {
        EXPENSE_TABLE_NAME: expenseTable.tableName,
      },
      role: lambdaExecutionRole,
    });

    // API methods for expenses
    const expenses = api.root.addResource('expenses');
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
  }
}
