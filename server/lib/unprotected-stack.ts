import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

import { RestApi, LambdaIntegration, CfnAuthorizer, AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import * as path from 'path';

// Use the same interface for the common props that will be passed to the other stacks
interface CommonProps extends StackProps {
  api: RestApi;
  authorizer: CfnAuthorizer;
}

// Define a class for the unprotected stack
export class UnprotectedStack extends Stack {
  constructor(scope: Construct, id: string, props: CommonProps) {
    super(scope, id, props);

    // Get the common resources from the props
    const { api, authorizer } = props;

    // Lambdas for protected and unprotected route
    const getProtectedLambda = new NodejsFunction(this, 'GetProtectedLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/routeLambda.ts`),
      handler: "handlerReadProtected",
    });

    const getUnprotectedLambda = new NodejsFunction(this, 'GetUnprotectedLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../lambdas/routeLambda.ts`),
      handler: "handlerReadUnprotected",
    });

    // API methods for protected and unprotected routes
    const protectedRoute = api.root.addResource('protected');
    protectedRoute.addMethod('GET', new LambdaIntegration(getProtectedLambda), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });

    const unprotectedRoute = api.root.addResource('unprotected');
    unprotectedRoute.addMethod('GET', new LambdaIntegration(getUnprotectedLambda));
  }
}