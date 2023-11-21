#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsServerStack } from '../lib/aws-server-stack';

const app = new cdk.App();
new AwsServerStack(app, 'AwsServerStack');
