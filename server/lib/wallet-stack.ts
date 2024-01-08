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

// Define an interface for the common props that will be passed to the other stacks
interface CommonProps extends StackProps {
  cognito: UserPool;
  api: RestApi;
  authorizer: CfnAuthorizer;
}

// Define a class for the wallet stack
export class WalletStack extends Stack {
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

    //Dynamodb Wallet table definition
    const walletTable = new Table(this, 'WalletTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'WalletsTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Grant the Lambda execution role permissions to access the wallet table
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
        ],
      })
    );

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

    // API methods for wallets
    const wallets = api.root.addResource('wallets');
    wallets.addMethod('GET', new LambdaIntegration(getAllWalletsLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    wallets.addMethod('POST', new LambdaIntegration(createWalletLambda), {
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
  }
}
