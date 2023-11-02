import { generateCardData } from '@/services/openai-service';
import { uploadToS3 } from '@/services/s3-service';
import { processCardImage } from '@/services/image-service';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import makeCard from '@/services/card-service';

export const config = {
    runtime: 'edge'
};

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse,
) {

    const { prompt } = request.body;

    try {

        const card = await makeCard(prompt);

        response.status(200).json({
            body: { ...card },
            query: request.query,
            cookies: request.cookies,
        });
    } catch (e) {
        response.status(500).json({ e });
    }
}