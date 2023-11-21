// import { Duration, Stack, StackProps } from 'aws-cdk-lib';
// import * as sns from 'aws-cdk-lib/aws-sns';
// import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
// import { Construct } from 'constructs';
//
// export class AwsServerStack extends Stack {
//   constructor(scope: Construct, id: string, props?: StackProps) {
//     super(scope, id, props);
//
//     const queue = new sqs.Queue(this, 'AwsServerQueue', {
//       visibilityTimeout: Duration.seconds(300)
//     });
//
//     const topic = new sns.Topic(this, 'AwsServerTopic');
//
//     topic.addSubscription(new subs.SqsSubscription(queue));
//   }
// }

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class AwsServerStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // defines an AWS Lambda resource
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,    // execution environment
      code: lambda.Code.fromAsset('lambda'),  // code loaded from "lambda" directory
      handler: 'hello.handler'                // file is "hello", function is "handler"
    });

    // defines an API Gateway REST API resource backed by our "hello" function.
    // new apigw.LambdaRestApi(this, 'Endpoint', {
    //   handler: hello
    // });
  }
}
