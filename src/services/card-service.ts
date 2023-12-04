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

const uploadToS3 = async (key: string, imageData: string) => {
    const bucket = process.env["AWS_S3_BUCKET"];

    const params = {
        Key: `cards/${key}`,
        Bucket: bucket,
        Body: imageData,
        ContentEncoding: 'base64',
        ContentType: `image/jpg`
    };

    let location = '';

    try {
        const result = await s3.putObject(params);
        location = `https://prismatic-cards-s3.s3.us-east-1.amazonaws.com/cards/${key}`
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

const resizeAndCompress = (imageData: string) => {

    try {

        console.log("Attempting to rezize/compress image...")

        const width = 512;
        const height = 512;

        const formattedDataString = imageData.split(';base64,').pop();

        if (!formattedDataString) return null;

        const data = Buffer.from(formattedDataString, 'base64');

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

const generateCard = async (prompt: string) => {

    // DALL-E
    const image = await openai.images.generate({
        //@ts-ignore
        model: "dall-e-3",
        prompt: `${prompt}`,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
    });

    // CHATGPT
    const chatContext = "You are generating card information for an online playing card game like Hearthstone or Magic the Gathering. Players will battle each other using these cards. Each card represents a 'unit', which should represent either a monster/creature/character, a spell, or any sort of fantastical phenomenon. You will be provided a description of the card's unit and you will create a title for the card. The title should be at most 24 characters long.";
    const titleConversation = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
            "role": "system",
            "content": chatContext
        },
        {
            "role": "user",
            "content": `Generate a title for a playing card with a unit described by the following prompt: ${prompt}.`,
        }
        ],
    });

    const descriptionConversation = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
            "role": "system",
            "content": chatContext
        },
        {
            "role": "user",
            "content": `Generate a description for a playing card with a unit described by the following prompt: ${prompt}.`,
        }
        ],
    });

    let title, description;
    title = titleConversation.choices[0]?.message.content || '';
    description = descriptionConversation.choices[0]?.message.content || '';

    if (!image.data[0]) throw new Error("No image data returned from OpenAI");

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
        title: title,
        desc: description,
        atk: attackScore,
        def: defenseScore,
        rarity: rarityScore,
    };

    return card;
};

const makeKeyName = (title: string) => `${title.toLowerCase().replaceAll(' ', '_')}:${Date.now()}`;
const mock_fulfill = async (cardData: any) => {
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

    const newCard = caller.pendingCard.fulfill(data);

    return newCard;
};

const makeCard = async (prompt: string) => {

    try {
        const card = await generateCard(prompt);
        const keyName = makeKeyName(card.title);

        const convertedImage = await resizeAndCompress(card.image);
        const location = await uploadToS3(keyName, convertedImage?.toString()!);

        return {
            title: card.title,
            description: card.desc,
            attack: card.atk,
            defense: card.def,
            rarity: card.rarity,
            imageUrl: location
        };
    }
    catch (e) {
        return Promise.reject(e);
    }
};

const mock_invokeGenerateCardLambda: (prompt: string, pendingCardId: number) => Promise<unknown> = async (prompt, pendingCardId) => {
    const cardData = await makeCard(prompt);
    return mock_fulfill({card: cardData, pendingCardId});
};

const invokeGenerateCardLambda: (prompt: string, pendingCardId: number) => Promise<PromiseResult<Lambda.InvocationResponse, AWSError>> = async (prompt, pendingCardId) => {

    const params = {
        FunctionName: 'PrismaticCardsStackStack-PrismaticCardsCreateCardE-lJyrI9o3x00P',
        Payload: JSON.stringify({
            prompt,
            pendingCardId
        })
    };

    return lambda.invoke(params).promise();
};


export { invokeGenerateCardLambda, mock_invokeGenerateCardLambda };