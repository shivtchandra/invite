import { kv } from "@vercel/kv";

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing invite ID" });
    }

    try {
        const data = await kv.get(`invite:${id}`);

        if (!data) {
            return res.status(404).json({ error: "Invite not found" });
        }

        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        return res.status(200).json(parsed);
    } catch (error) {
        console.error("Error fetching invite:", error);
        return res.status(500).json({ error: "Failed to fetch invite" });
    }
}
