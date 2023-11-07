import { db } from "@/server/db";
import { Card, Prisma } from "@prisma/client";
import { AWSError, Lambda } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { PutObjectRequest, S3 } from "@aws-sdk/client-s3";
import OpenAI from "openai";
import sharp from 'sharp';
import { env } from "@/env.mjs";
import { z } from "zod";
import { appRouter } from "@/server/api/root";

const lambda = new Lambda({
    region: 'us-east-1'
});

// Local version of lambda function for local testing purposes

const apiKey = env["OPENAI_API_KEY"];

const openai = new OpenAI({
    apiKey: apiKey,
});

const s3 = new S3();

const uploadToS3 = async (keyName: string, imageData: Buffer) => {
    const bucket = process.env["AWS_S3_BUCKET"];

    const params = {
        Key: `cards/${keyName}`,
        Bucket: bucket,
        Body: imageData,
        ContentEncoding: 'base64',
        ContentType: `image/jpg`
    };

    let location = '';
    let key = '';

    try {
        const result = await s3.putObject(params);
        location = `https://prismatic-cards-s3.s3.us-east-1.amazonaws.com/cards/${keyName}`
        console.log("[S3] Successfully uploaded at:", location);
        return location;
    }
    catch (e) {
        throw new Error(JSON.stringify(e));
    }
}

const CardRarity = {
    Bronze: 0,
    Silver: 1,
    Gold: 2,
    Prismatic: 3
};

const processCardImage = (imageData: string) => {

    try {

        console.log("Attempting to rezize/compress image...")

        const width = 512;
        const height = 512;


        const data = Buffer.from(imageData.split(';base64,').pop() as string, 'base64');

        const image = sharp(data)
            .resize(width, height)
            .toFormat('jpeg')
            .jpeg({
                force: true
            })
            .toBuffer();

        return image;

    }
    catch (e) { throw new Error(`[Sharp] ${e}`) }
};

const generateCardData = async (prompt: string) => {


    // DALL-E
    const image = await openai.images.generate({
        prompt: `${prompt}`,
        size: "512x512",
        response_format: "b64_json",
    });

    // CHATGPT
    const info = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
            "role": "system",
            "content": "You are generating card information for a playing card game. You will be provided descriptions of the card's image and you will convert these descriptions into a dramatic title and description for the card. The title and description should be formatted as '%t\n%d, where %t is the title and %d is the description. Both should be at most 250 characters long.",
        },
        {
            "role": "user",
            "content": `Generate a title and card description for a playing card with following image: ${prompt}.`,
        }
        ],
    });

    if (!image.data[0]) throw new Error("No image data returned from OpenAI");
    if (!info.choices[0]) throw new Error("No data returned from OpenAI");

    const content = info.choices[0].message.content!;

    const contentArray = content.split("\n");
    let t = contentArray[0] || '';
    let d = contentArray[1] || '';

    t = t.replaceAll("Title: ", "");
    t = t.replaceAll("\"", "");

    d = d.replaceAll("Description: ", "");
    d = d.replaceAll("\"", "");

    const attackScore = Math.floor(Math.random() * 10);
    const defenseScore = Math.floor(Math.random() * 10);

    // 1% prismatic
    // 9% gold
    // 20% silver
    // 70% bronze
    const rarityRoll = Math.random();
    let rarityScore;
    if (rarityRoll < 0.01) {
        rarityScore = CardRarity.Prismatic;
    }
    else if (rarityRoll < 0.1) {
        rarityScore = CardRarity.Gold;
    }
    else if (rarityRoll < 0.3) {
        rarityScore = CardRarity.Silver;
    }
    else {
        rarityScore = CardRarity.Bronze;
    }


    const card = {
        image: `data:image/png;base64,${image.data[0].b64_json}`,
        title: t,
        desc: d,
        atk: attackScore,
        def: defenseScore,
        rarity: rarityScore,
    };

    console.log("[OpenAI] Data from openai: ", card)

    return card;
};

const mock_persist = async (cardData: any) => {
    const caller = appRouter.createCaller({
        session: null,
        db: db
    });

    const input = z.object({
        card: z.object({
            title: z.string(),
            description: z.string(),
            attack: z.number(),
            defense: z.number(),
            rarity: z.number(),
            imageUrl: z.string(),
        }),
        pendingCardId: z.number()
    }).safeParse(cardData);

    if (!input.success) {
        throw new Error("Input data of invalid shape");
    }

    const data = input.data;

    const newCard = caller.card.fulfillPendingCard(data);

    return newCard;
};

const mock_makeCard = async (prompt: string, pendingCardId: number) => {

    try {
        const card = await generateCardData(prompt);

        console.log("Generated card: ", card);

        const convertedImage = await processCardImage(card.image);

        if (!convertedImage) throw Error("No data returned from image processing");

        console.log("Processed image");

        const keyName = `${card.title}:${card.desc.substring(0, 32)}:${Date.now()}`;

        const location = await uploadToS3(keyName, convertedImage);

        console.log("S3 location received:", location);

        return mock_persist({
            card: {
                title: card.title,
                description: card.desc,
                attack: card.atk,
                defense: card.def,
                rarity: card.rarity,
                imageUrl: location
            },
            pendingCardId: pendingCardId
        });
    }
    catch (e) {
        throw e;
    }
};

const mock_invokeGenerateCardLambda: (prompt: string, pendingCardId: number) => Promise<unknown> = async (prompt, pendingCardId) => {
    return mock_makeCard(prompt, pendingCardId);
};

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


export { invokeGenerateCardLambda, mock_invokeGenerateCardLambda };