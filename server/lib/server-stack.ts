import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class ServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'WalletPool', {
      userPoolName: 'WalletPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true
      },
      autoVerify: { email: true },
      standardAttributes: {
        email: {
          required: true,
        },
        familyName: {
          required: true,
        },
      },
      passwordPolicy: {
        minLength: 8
      }
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'WalletPoolClient', {
      userPool, // Linking this client to the previously defined User Pool
      authFlows: {
        userSrp: true // Enabling SRP-based authentication flow for this client
      },
      generateSecret: false // This example does not generate a client secret for simplicity
    });
  }
}
