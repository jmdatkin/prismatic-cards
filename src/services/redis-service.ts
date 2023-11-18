import { RedisClientType } from "@redis/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createClient } from "redis";

let client: RedisClientType | null = null;

const getClient = () => {
    if (client === null) {
        client = createClient({
            url: "rediss://default:********@us1-holy-doe-39276.upstash.io:39276"
        });
        client.on("error", function (err) {
            throw err;
        });
        client.connect()
    }
    return client;
}

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "24 h"),
    analytics: true,
    /**
     * Optional prefix for the keys used in redis. This is useful if you want to share a redis
     * instance with other applications and want to avoid key collisions. The default prefix is
     * "@upstash/ratelimit"
     */
    prefix: "@upstash/ratelimit",
});

export { getClient, ratelimit };