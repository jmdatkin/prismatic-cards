import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path = require('path');
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PrismaticCardsStackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    const apiHandlerFunction = new Function(this, "ApiHandler", {
      code: Code.fromAsset(path.resolve(__dirname,"../handlers")), // 👈 This is crucial
      runtime: Runtime.NODEJS_18_X,
      handler: "main.handler",
      environment: {}, // 👈 You might need env variables
      timeout: cdk.Duration.seconds(30)
    });

    const api = new RestApi(this, "Api", {
      deploy: true,
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
    });

    api.root.addMethod("POST", new LambdaIntegration(apiHandlerFunction));

    const apiKey = api.addApiKey("ApiKey"); // 👈 to ease your testing

    const usagePlan = api.addUsagePlan("UsagePlan", {
      name: "UsagePlan",
      apiStages: [
        {
          api,
          stage: api.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey);
  }
}
