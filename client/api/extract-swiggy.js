function toTitleCase(value) {
    return value
        .split(" ")
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => token[0].toUpperCase() + token.slice(1))
        .join(" ");
}

const CUISINE_HINTS = ["biryani", "pizza", "burger", "sushi", "kebab", "momos", "dosa", "noodle", "shawarma", "thali", "pasta", "bbq"];

function inferCuisine(tokens) {
    const tokenHit = tokens.find((token) => CUISINE_HINTS.find((hint) => token.toLowerCase().includes(hint)));
    return tokenHit ? toTitleCase(tokenHit) : "";
}

export default async function handler(req, res) {
    const rawUrl = String(req.query.url || "");
    if (!rawUrl) return res.status(400).json({ error: "Missing url parameter" });

    try {
        const parsed = new URL(rawUrl);
        if (parsed.hostname.includes("swiggy.onelink.me")) {
            const afDpRaw = parsed.searchParams.get("af_dp") || parsed.searchParams.get("deep_link_value") || "";
            const decodedDeepLink = decodeURIComponent(afDpRaw);
            const match = decodedDeepLink.match(/details\/(\d+)/i);
            return res.json({ restaurantId: match ? match[1] : "" });
        }

        const segments = parsed.pathname.split("/").filter(Boolean);
        const restaurantId = segments.slice().reverse().find((s) => /^\d+$/.test(s));
        const slug = [...segments].reverse().find((s) => s.includes("-")) || "";

        if (!slug) return res.json({ restaurantId: restaurantId || "" });

        const tokens = decodeURIComponent(slug).split("-").filter(s => !/^\d+$/.test(s));
        const nameEnd = Math.max(2, Math.ceil(tokens.length * 0.58));

        return res.json({
            name: toTitleCase(tokens.slice(0, nameEnd).join(" ")),
            location: toTitleCase(tokens.slice(nameEnd).join(" ")),
            cuisine: inferCuisine(tokens),
            restaurantId: restaurantId || ""
        });
    } catch {
        return res.status(500).json({ error: "Failed to parse URL" });
    }
}
