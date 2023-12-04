// const pkg = require("@aws-sdk/client-s3");
// const OpenAI = require("openai");
// const sharp = require("@img/sharp-linux-x64");
import sharp from "sharp";
// const axios = require("axios");
import { PutObjectCommandInput, PutObjectRequest, S3 } from "@aws-sdk/client-s3";
import OpenAI from "openai";
// import sharp from "sharp";
import axios from "axios";
import { Handler } from 'aws-lambda';

const apiKey = process.env["OPENAI_API_KEY"];

const openai = new OpenAI({
    apiKey: apiKey,
});

const s3 = new S3();

const uploadToS3 = async (key: string, imageData: string | Buffer) => {
    console.log("[stage:s3] Attempting upload resource to s3 with key " + key);

    const bucket = process.env["AWS_S3_BUCKET"];

    const params: PutObjectCommandInput = {
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
        console.log("[stage:s3] Successfully uploaded at:", location);
        return location;
    }
    catch (e) {
        console.error("[stage:s3] Upload failed: " + e);
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
        console.log("[stage:sharp] Attempting to rezize/compress image...")

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
    catch (e) { throw new Error(`[stage:sharp] An error occurred: ${e}`) }
};

const generateCard = async (prompt: string) => {
    console.log("[stage:openAI] Attempting fetching data from OpenAI APIs");
    console.log("[stage:openAI] Prompt: " + prompt);

    // DALL-E
    const image = await openai.images.generate({
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
    title = titleConversation.choices[0].message.content || '';
    description = descriptionConversation.choices[0].message.content || '';

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

    console.log("[stage:openAI] API call successful");
    console.log("[stage:openAI] Title: " + title);
    console.log("[stage:openAI] Description: " + title);



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

const makeCard = async (prompt: string) => {

    try {
        const card = await generateCard(prompt);
        const keyName = makeKeyName(card.title);

        const convertedImage = await resizeAndCompress(card.image);
        // const convertedImage = card.image; //Test lambda without sharp
        // const location = await uploadToS3(keyName, convertedImage?.toString()!);
        const location = await uploadToS3(keyName, convertedImage!);

        return Promise.resolve({
            title: card.title,
            description: card.desc,
            attack: card.atk,
            defense: card.def,
            rarity: card.rarity,
            imageUrl: location
        });
    }
    catch (e) {
        return Promise.reject(e);
    }
};

export const handler: Handler = async (event) => {

    const prompt = event.prompt;
    const pendingCardId = +event.pendingCardId;

    const cardData = await makeCard(prompt);

    console.log("[stage:prismaticAPI] Making API request back to prismatic cards");
    console.log("[stage:prismaticAPI] Data:");
    console.log(cardData);

    try {
        const axiosResponse = await axios.post('https://prismatic-cards.vercel.app/api/card_extras/fulfill', {
            pendingCardId,
            card: { ...cardData }
        });


        const response = {
            statusCode: 202,
            message: "Card successfully fulfilled"
        };
        console.log("[stage:prismaticAPI] Card successfully fulfilled");
        console.log(axiosResponse);
        return response;
    }
    catch (e) {
        console.error("[stage:prismaticAPI] An error occurred");
        console.error(e);
        const response = {
            statusCode: 500,
            body: 'An error occurred:' + e,
        };
        return response;
    }
};

module.exports.handler = handler;