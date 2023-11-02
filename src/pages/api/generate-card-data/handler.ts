import { generateCardData } from '@/services/openai-service';
import { uploadToS3 } from '@/services/s3-service';
import { processCardImage } from '@/services/image-service';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { env } from 'process';

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse,
) {

    const { prompt } = request.body;

    console.log(prompt);

    try {
        const card = await generateCardData(prompt);

        console.log("card?", card);

        const convertedImage = await processCardImage(card.image);

        if (!convertedImage) throw Error("No data returned from image processing");

        const keyName = `${request.body.user.id}:${card.title}:${card.desc.substring(0, 32)}:${Date.now()}`;

        const location = await uploadToS3(keyName, convertedImage);

        response.status(200).json({
            body: {
                card: {
                    title: card.title,
                    description: card.desc,
                    attack: card.atk,
                    defense: card.def,
                    rarity: card.rarity,
                },
                imageLocation: location
            },
            query: request.query,
            cookies: request.cookies,
        });
    } catch (e) {
        response.status(500).json({ e });
    }
}