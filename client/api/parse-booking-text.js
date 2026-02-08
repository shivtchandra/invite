function buildDatetimeLocal(dateText, timeText) {
    const candidate = `${dateText || ""} ${timeText || ""}`.trim();
    if (!candidate) return "";
    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function parseSwiggyLinkClient(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.hostname.includes("swiggy.onelink.me")) {
            const afDpRaw = parsed.searchParams.get("af_dp") || parsed.searchParams.get("deep_link_value") || "";
            const decodedDeepLink = afDpRaw ? decodeURIComponent(afDpRaw) : "";
            const match = decodedDeepLink.match(/details\/(\d+)/i);
            return { restaurantId: match ? match[1] : "" };
        }
        return {};
    } catch { return {}; }
}

export default async function handler(req, res) {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const details = {};
    const cleanText = text.replace(/\s+/g, " ").trim();

    // Date/Time
    const bookingMatch = cleanText.match(/booking on\s+([^,]+),\s*([0-9: ]+[APMapm]{2})/i);
    if (bookingMatch) {
        details.bookingDate = bookingMatch[1].trim();
        details.bookingTime = bookingMatch[2].trim().toUpperCase();
        details.time = buildDatetimeLocal(details.bookingDate, details.bookingTime);
    }

    // Guests
    const guestsMatch = cleanText.match(/for\s+(\d+)\s+guest/i);
    if (guestsMatch) details.peopleGoing = guestsMatch[1];

    // Venue
    const venueMatch = cleanText.match(/at\s+(.+?)\s+with offer/i);
    const venueFallback = cleanText.match(/at\s+(.+?)\.\s*please reach/i);
    const venueRaw = (venueMatch?.[1] || venueFallback?.[1] || "").trim();
    if (venueRaw) {
        const parts = venueRaw.split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length) {
            details.restaurantName = parts[0];
            details.location = parts.slice(1).join(", ");
        }
    }

    // Offer
    const offerMatch = cleanText.match(/with offer\s+(.+?)(?:\.|please reach|checkout)/i);
    if (offerMatch) details.offer = offerMatch[1].trim();

    // URL
    const urlMatch = cleanText.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
        details.swiggyUrl = urlMatch[0].trim().replace(/[),.;]+$/, "");
        const parsed = parseSwiggyLinkClient(details.swiggyUrl);
        if (parsed.restaurantId) details.restaurantId = parsed.restaurantId;
    }

    res.status(200).json(details);
}
