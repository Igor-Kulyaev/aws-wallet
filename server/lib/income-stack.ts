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

// Define a class for the income stack
export class IncomeStack extends Stack {
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

    //Dynamodb Income table definition
    const incomeTable = new Table(this, 'IncomeTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'IncomesTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Add a global secondary index for the walletId attribute
    incomeTable.addGlobalSecondaryIndex({
      indexName: 'walletIdIndex',
      partitionKey: { name: 'walletId', type: AttributeType.STRING },
    });

    // Grant the Lambda execution role permissions to access the income table
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
          incomeTable.tableArn,
          incomeTable.tableArn + '/index/walletIdIndex',
        ],
      })
    );

    // CRUD lambdas for income
    const createIncomeLambda = new NodejsFunction(this, 'CreateIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: "handlerCreate",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const readIncomeLambda = new NodejsFunction(this, 'ReadIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: "handlerRead",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const updateIncomeLambda = new NodejsFunction(this, 'UpdateIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: "handlerUpdate",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const deleteIncomeLambda = new NodejsFunction(this, 'DeleteIncomeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: "handlerDelete",
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    const getAllIncomesLambda = new NodejsFunction(this, 'GetAllIncomesLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/incomeLambda.ts`),
      handler: 'handlerGetAll',
      environment: {
        INCOME_TABLE_NAME: incomeTable.tableName,
      },
      role: lambdaExecutionRole,
    });

    // API methods for incomes
    const incomes = api.root.addResource('incomes');
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
  }
}
