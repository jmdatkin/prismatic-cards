import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";
import { invokeGenerateCardLambda, mock_invokeGenerateCardLambda } from "@/services/card-service";
import { env } from "@/env.mjs";
import rateLimiterMiddleware from "@/middleware/rateLimiterMiddleware";
import { QueryClient } from "@tanstack/react-query";

export const pendingCardRouter = createTRPCRouter({
    getAll: publicProcedure
        .query(({ ctx }) => {
            return ctx.db.pendingCard.findMany();
        }),

    /** Gets pending cards created by the current user */
    getOwn: protectedProcedure
        .query(({ ctx }) => {
            return ctx.db.pendingCard.findMany({
                where: {
                    createdById: ctx.session.user.id,
                    fulfilled: false
                }
            })
        }),

    get: protectedProcedure
        .input(z.number())
        .query(({ ctx, input }) => {
            return ctx.db.pendingCard.findFirst({
                where: {
                    id: input
                }
            })
        }),

    create: protectedProcedure
        // .use(rateLimiterMiddleware)
        .input(z.object({ prompt: z.string().min(1).max(255) }))
        .mutation(async ({ ctx, input }) => {
            const prompt = input.prompt;


            // // const { success: allowed } = await ratelimit.limit(ctx.session.user.id);
            // const allowed = true;

            // if (allowed) {
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

            // } else {
            //     console.error("Rate limit reached");
            // }
        }),

    fulfill: publicProcedure
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

            console.log(pendingCard);

            const newFulfilledCard = await ctx.db.card.create({
                data: { ...input.card, prompt: pendingCard.prompt, createdById: pendingCard.createdById }
            })

            if (newFulfilledCard) {
                console.log(newFulfilledCard, "updating");
                const updateResult = await ctx.db.pendingCard.update({
                    data: {
                        fulfilled: true
                    },
                    where: {
                        id: input.pendingCardId
                    }
                });

                console.log("updateResult", updateResult);

                const queryClient = new QueryClient();
                queryClient.invalidateQueries();

            }

            return newFulfilledCard;
        }),
});