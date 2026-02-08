const FALLBACK_RESTAURANT_IMAGES = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=80"
];

function pickFallbackImage(seed) {
    const value = String(seed || "invite");
    const score = [...value].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return FALLBACK_RESTAURANT_IMAGES[score % FALLBACK_RESTAURANT_IMAGES.length];
}

export default async function handler(req, res) {
    const name = String(req.query.name || "").trim();
    const location = String(req.query.location || "").trim();

    // On Vercel, we'll use the fallback logic unless Google Places API key is configured
    // For now, let's just make it return the fallback so it doesn't break
    const fallbackUrl = pickFallbackImage(`${name}-${location}`);

    return res.json({
        source: "unsplash-fallback",
        name,
        location,
        imageUrl: fallbackUrl
    });
}
