import { Construct } from 'constructs';
import {Stack, StackProps, CfnOutput, RemovalPolicy} from 'aws-cdk-lib';

import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import {Runtime, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import * as path from 'path';
import {LambdaIntegration, RestApi, Cors} from "aws-cdk-lib/aws-apigateway";
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class ServerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
      },
      role: lambdaExecutionRole, // Assign the execution role to the Lambda function
    });

    // Attach the AWS managed policy to the execution role
    lambdaExecutionRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    lambdaExecutionRole.addToPolicy(
      new PolicyStatement({
        actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
        resources: [walletTable.tableArn], // Replace `walletTable` with your DynamoDB table object reference
      })
    );

    const api = new RestApi(this, 'WalletsAPI', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // For testing purposes, allowing all origins
        allowMethods: Cors.ALL_METHODS, // All HTTP methods (GET, POST, PUT, DELETE, etc.)
        allowHeaders: ['*'], // Allow any headers in the request
      },
    });

    const wallets = api.root.addResource('wallets');
    wallets.addMethod('GET', new LambdaIntegration(readWalletLambda));
    wallets.addMethod('POST', new LambdaIntegration(createWalletLambda));

    const singleWallet = wallets.addResource('{id}');
    singleWallet.addMethod('GET', new LambdaIntegration(readWalletLambda));
    singleWallet.addMethod('PUT', new LambdaIntegration(updateWalletLambda));
    singleWallet.addMethod('DELETE', new LambdaIntegration(deleteWalletLambda));

  }
}
