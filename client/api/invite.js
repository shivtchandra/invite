import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

function generateId() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method === "POST") {
        try {
            const payload = req.body;

            if (!payload || typeof payload !== "object") {
                return res.status(400).json({ error: "Invalid payload" });
            }

            let id = generateId();
            let attempts = 0;
            while (attempts < 10) {
                const existing = await redis.get(`invite:${id}`);
                if (!existing) break;
                id = generateId();
                attempts++;
            }

            // Store with 30 day expiration (in seconds)
            await redis.set(`invite:${id}`, JSON.stringify(payload), { ex: 60 * 60 * 24 * 30 });

            return res.status(200).json({ id });
        } catch (error) {
            console.error("Error creating invite:", error);
            return res.status(500).json({ error: "Failed to create invite" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
