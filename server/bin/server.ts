#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerStack } from '../lib/server-stack';

const app = new cdk.App();
new ServerStack(app, 'CdkTypescriptStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// import { App } from 'aws-cdk-lib';
// import { CognitoStack } from '../lib/cognito-stack';
// import { WalletStack } from '../lib/wallet-stack';
// import { IncomeStack } from '../lib/income-stack';
// import { ExpenseStack } from '../lib/expense-stack';
// import { UnprotectedStack } from '../lib/unprotected-stack';
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