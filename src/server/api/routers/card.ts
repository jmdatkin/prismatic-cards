import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { invokeGenerateCardLambda, mock_invokeGenerateCardLambda } from "@/services/card-service";
import { env } from "@/env.mjs";
import { Card } from "@prisma/client";
import { CardRarity } from "@/types/card-rarity";
import { rule } from "postcss";
import { useQuery } from "@tanstack/react-query";
import { getQueryClient } from "@trpc/react-query/shared";
import { api } from "@/utils/api";

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

      if (env["NODE_ENV"] === "production")
      // Invoke lambda without caring about return type to avoid timeout
        void invokeGenerateCardLambda(prompt, newPendingCard.id);
      else
        mock_invokeGenerateCardLambda(prompt, newPendingCard.id);

      return newPendingCard;
    }),

  fulfillPendingCard: publicProcedure
    .input(z.object({
      card: z.object({
        title: z.string(),
        description: z.string(),
        attack: z.number(),
        defense: z.number(),
        rarity: z.number(),
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
              id: true,
            }
          }
        }
      });

      if (!pendingCard) return;

      const newFulfilledCard = await ctx.db.card.create({
        data: { ...input.card, prompt: pendingCard.prompt, createdById: pendingCard.createdById }
      })

      if (newFulfilledCard) {
        ctx.db.pendingCard.update({
          data: {
            fulfilled: true
          },
          where: {
            id: pendingCard.id
          }
        });
        api.useUtils().card.getAll.invalidate(); 
      }

      return newFulfilledCard;
    }),

  create: protectedProcedure
    // .input(z.object({ prompt: z.string().min(1).max(255) }))
    .input(z.object({
      title: z.string(),
      description: z.string(),
      attack: z.number(),
      defense: z.number(),
      rarity: z.nativeEnum(CardRarity),
      imageUrl: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {

      try {
        return ctx.db.card.create({
          data: {
            title: input.title,
            description: input.description,
            attack: input.attack,
            defense: input.defense,
            rarity: input.rarity,
            imageUrl: input.imageUrl,
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });

      } catch (e) { throw e }
    }),

});
