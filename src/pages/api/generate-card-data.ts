import { generateCardData } from '@/services/openai-service';
import { uploadToS3 } from '@/services/s3-service';
import { processCardImage } from '@/services/image-service';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import makeCard from '@/services/card-service';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
    runtime: 'edge'
};

export default async function handler(
    request: NextRequest,
) {
    try {
        const { searchParams } = new URL(request.url);

        const prompt = searchParams.get('prompt');

        if (!prompt) return new Response("Invalid or no prompt provided.", { status: 500 })

        const card = await makeCard(prompt);

        return new Response(
            JSON.stringify({
                body: { ...card },
            }), { status: 200 })
    } catch (e) {
        return new Response(JSON.stringify(e), { status: 500 })
    }
}