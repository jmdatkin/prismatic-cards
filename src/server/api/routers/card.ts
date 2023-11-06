import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { invokeGenerateCardLambda } from "@/services/card-service";
import { env } from "@/env.mjs";
import { Card } from "@prisma/client";

export const cardRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.db.card.findMany({
        orderBy: { createdAt: "desc" }
      });
    }),

  createPending: protectedProcedure
    .input(z.object({ prompt: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const prompt = input.prompt;

      const newPendingCard = await ctx.db.pendingCard.create({
        data: {
          prompt: prompt,
          createdBy: { connect: { id: ctx.session.user.id } },
        }
      });

      if (!newPendingCard) return;

      // Invoke lambda without caring about return type to avoid timeout
      void invokeGenerateCardLambda(prompt, newPendingCard.id);

      return newPendingCard;
    }),

  fulfillPendingCard: publicProcedure
    .input(z.object({
      card: z.object({
        title: z.string(),
        description: z.string(),
        attack: z.number(),
        defense: z.number(),
        imageUrl: z.string(),
      }),
      pendingCardId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {

      const pendingCard = await ctx.db.pendingCard.findFirst({
        where: { id: input.pendingCardId },
        include: {
          createdBy: {
            select: {
              id: true
            }
          }
        }
      });

      if (!pendingCard) return;

      const newFulfilledCard = ctx.db.card.create({
        data: { ...input.card, createdById: pendingCard.createdById }
      })

      return newFulfilledCard;
    }),

  create: protectedProcedure
    // .input(z.object({ prompt: z.string().min(1).max(255) }))
    .input(z.object({
      title: z.string(),
      description: z.string(),
      attack: z.number(),
      defense: z.number(),
      imageUrl: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // const prompt = input.prompt;

      try {
        // console.log(cardData);

        // if (cardData.StatusCode === 500) throw Error("An error occurred during lambda execution.");

        // console.log("cardDataPayload?", cardData.Payload);
        // const cardDataObj = JSON.parse(JSON.parse(cardData.Payload?.toString()!).body);
        // console.log("cardDataObj?", cardDataObj);

        return ctx.db.card.create({
          data: {
            title: input.title,
            description: input.description,
            attack: input.attack,
            defense: input.defense,
            imageUrl: input.imageUrl,
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });

      } catch (e) { throw e }
    }),

});
