import { db } from "@/server/db";
import { Card, Prisma } from "@prisma/client";
import { AWSError, Lambda } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";

const lambda = new Lambda({
    region: 'us-east-1'
});

const invokeGenerateCardLambda: (prompt: string, pendingCardId: number) => Promise<PromiseResult<Lambda.InvocationResponse, AWSError>> = async (prompt, pendingCardId) => {

    const params = {
        FunctionName: 'prismatic-cards_generate-card-data',
        Payload: JSON.stringify({
            prompt,
            pendingCardId
        })
    };

    return lambda.invoke(params).promise();
};


const fulfillPending: (pendingCardId: number, fulfilledCardData: Card) => any = (pendingCardId, fulfilledCardData) => {
    db.card.create(
        {
            data: fulfilledCardData
        }
    );
}

export { invokeGenerateCardLambda, fulfillPending };