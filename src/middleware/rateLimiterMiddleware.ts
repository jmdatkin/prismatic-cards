import { ratelimit } from "@/services/redis-service";
import { TRPCError } from "@trpc/server";

export default async function rateLimiterMiddleware(opts: any) {
    const { ctx } = opts;
    const limited = await ratelimit.limit(ctx.session.user.id);

    if (limited) {
        throw new TRPCError({message: "Rate limit reached for user id " + ctx.session.user.id, code: "TOO_MANY_REQUESTS"});
    } else {
        return opts.next()
    }
};