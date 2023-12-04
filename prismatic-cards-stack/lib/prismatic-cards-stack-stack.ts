import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path = require('path');
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PrismaticCardsStackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // const role = new Role(this, 'PrismaticCardsLambdaExecutionRole', {
    //   assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    //   description: "Allows lambda execution and uploading to s3",
    //   managedPolicies: [
    //     ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
    //     ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonS3_FullAccess")
    //   ]
    // })

    // role.addToPolicy(new PolicyStatement({
    //   resources: ['*'],
    //   effect: Effect.ALLOW,
    //   actions: ["lambda:"]
    // }))

    // example resource
    const apiHandlerFunction = new Function(this, "PrismaticCards_CreateCard", {
      code: Code.fromAsset(path.resolve(__dirname,"../handlers")), // 👈 This is crucial
      runtime: Runtime.NODEJS_20_X,
      handler: "main.handler",
      environment: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
        AWS_S3_REGION: process.env.AWS_S3_REGION!,
        AWS_S3_BUCKET: process.env.AWS_S3_BUCKET!
      }, // 👈 You might need env variables
      timeout: cdk.Duration.seconds(30),
    });

    apiHandlerFunction.addToRolePolicy(new PolicyStatement({
      resources: ['*'],
      effect: Effect.ALLOW,
      actions: ["s3:*"]
    }))

  }
}
