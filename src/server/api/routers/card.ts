import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import makeCard from "@/services/card-service";
import { env } from "@/env.mjs";

export const cardRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.db.card.findMany();
    }),

  create: protectedProcedure
    .input(z.object({ prompt: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const prompt = input.prompt;

      let cardData;

      if (env.NODE_ENV === "development")
        cardData = await makeCard(prompt);
      else if (env.NODE_ENV === "production") {
        const result = await fetch(`${process.env["BASE_URL"]}/api/generate-card-data?prompt=${prompt}`);
        const text = await result.text();

        console.log("text?", text)

        cardData = JSON.parse(text);
      } else throw Error("NODE_ENV environment variable has an unrecognized value");

      return ctx.db.card.create({
        data: {
          title: cardData.card.title,
          description: cardData.card.description,
          attack: cardData.card.attack,
          defense: cardData.card.defense,
          imageUrl: cardData.imageUrl,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

});
