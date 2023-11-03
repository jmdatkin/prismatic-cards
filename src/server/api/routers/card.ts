import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { getCardFromLambda } from "@/services/card-service";
import { env } from "@/env.mjs";

export const cardRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.db.card.findMany({
        orderBy: { createdAt: "desc" }
      });
    }),

  create: protectedProcedure
    .input(z.object({ prompt: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const prompt = input.prompt;

      try {
        const cardData = await getCardFromLambda(prompt);

        console.log(cardData);
        
        if (cardData.StatusCode === 500) throw Error("An error occurred during lambda execution.");

        console.log("cardDataPayload?", cardData.Payload);
        const cardDataObj = JSON.parse(JSON.parse(cardData.Payload?.toString()!).body);
        console.log("cardDataObj?", cardDataObj);

        return ctx.db.card.create({
          data: {
            title: cardDataObj.card.title,
            description: cardDataObj.card.description,
            attack: cardDataObj.card.attack,
            defense: cardDataObj.card.defense,
            imageUrl: cardDataObj.imageUrl,
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });
      } catch (e) { throw e }
    }),

});
