import { AWSError, Lambda } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";

const lambda = new Lambda({
    region: 'us-east-1'
});

const getCardFromLambda: (prompt: string) => Promise<PromiseResult<Lambda.InvocationResponse, AWSError>> = async (prompt) => {

    const params = {
        FunctionName: 'prismatic-cards_generate-card-data',
        Payload: JSON.stringify({
            prompt
        })
    };

    return lambda.invoke(params).promise();
};

export { getCardFromLambda };