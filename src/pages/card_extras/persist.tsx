import { appRouter } from '@/server/api/root';
import { cardRouter } from '@/server/api/routers/card';
import { db } from '@/server/db';
import { useMutation } from '@tanstack/react-query';
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod';

type ResponseData = {
  message: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
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
        imageUrl: z.string(),
      }),
      pendingCardId: z.number()
    }).safeParse(req.body);

    if (!input.success) {
      throw new Error("Input data of invalid shape");
    }

    const data = input.data;

    const newCard = caller.card.fulfillPendingCard(data);
  
    res.status(200).json({message: JSON.stringify(newCard)});
    return newCard;
  } catch (error) {
    res.status(500).json({message: "Error: " + error});
  }
}