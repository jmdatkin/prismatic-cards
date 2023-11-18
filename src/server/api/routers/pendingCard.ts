import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";

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
});