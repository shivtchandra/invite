const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 8787;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "invites.json");
let inviteStore = {};

// Load existing invites on startup
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    inviteStore = JSON.parse(raw);
  }
} catch (e) {
  console.error("Failed to load invites:", e);
  inviteStore = {};
}

function generateId() {
  return crypto.randomBytes(4).toString("hex").slice(0, 7);
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(inviteStore, null, 2));
  } catch (e) {
    console.error("Failed to save invites:", e);
  }
}

const CUISINE_HINTS = [
  "biryani",
  "pizza",
  "burger",
  "sushi",
  "kebab",
  "momos",
  "dosa",
  "noodle",
  "shawarma",
  "thali",
  "pasta",
  "bbq"
];

const FALLBACK_RESTAURANT_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80"
];

function toTitleCase(value) {
  return value
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join(" ");
}

function inferCuisine(tokens) {
  const tokenHit = tokens.find((token) =>
    CUISINE_HINTS.find((hint) => token.toLowerCase().includes(hint))
  );
  if (!tokenHit) {
    return "";
  }
  return toTitleCase(tokenHit);
}

function pickFallbackImage(seed) {
  const value = String(seed || "invite");
  const score = [...value].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return FALLBACK_RESTAURANT_IMAGES[score % FALLBACK_RESTAURANT_IMAGES.length];
}

function buildDatetimeLocal(dateText, timeText) {
  const candidate = `${dateText || ""} ${timeText || ""}`.trim();
  if (!candidate) {
    return "";
  }
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function extractRestaurantId(value) {
  if (!value) {
    return "";
  }
  const match = String(value).match(/details\/(\d+)/i);
  return match ? match[1] : "";
}

function parseSwiggyLink(rawUrl) {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.hostname.includes("swiggy.onelink.me")) {
      const afDpRaw = parsed.searchParams.get("af_dp") || parsed.searchParams.get("deep_link_value") || "";
      const afWebRaw = parsed.searchParams.get("af_web_dp") || "";
      const decodedDeepLink = afDpRaw ? decodeURIComponent(afDpRaw) : "";
      const decodedWebUrl = afWebRaw ? decodeURIComponent(afWebRaw) : "";

      const result = {};
      if (decodedDeepLink) {
        result.deepLink = decodedDeepLink;
      }

      const idFromDeepLink = extractRestaurantId(decodedDeepLink);
      if (idFromDeepLink) {
        result.restaurantId = idFromDeepLink;
      }

      if (decodedWebUrl && decodedWebUrl !== rawUrl) {
        const webParsed = parseSwiggyLink(decodedWebUrl);
        return { ...webParsed, ...result };
      }
      return result;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const restaurantId = segments
      .slice()
      .reverse()
      .find((segment) => /^\d+$/.test(segment));
    const slug = [...segments].reverse().find((segment) => segment.includes("-")) || "";

    if (!slug) {
      return restaurantId ? { restaurantId } : {};
    }

    const tokens = decodeURIComponent(slug)
      .split("-")
      .map((token) => token.trim())
      .filter(Boolean)
      .filter((token) => !/^\d+$/.test(token));

    if (!tokens.length) {
      return {};
    }

    const nameEnd = Math.max(2, Math.ceil(tokens.length * 0.58));
    const nameTokens = tokens.slice(0, nameEnd);
    const locationTokens = tokens.slice(nameEnd);

    const name = toTitleCase(nameTokens.join(" "));
    const location =
      toTitleCase(locationTokens.join(" ")) ||
      toTitleCase(segments.find((segment) => segment !== "city") || "");
    const cuisine = inferCuisine(tokens);

    return { name, location, cuisine, restaurantId: restaurantId || "" };
  } catch {
    return {};
  }
}

function parseBookingText(rawText) {
  const text = String(rawText || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return {};
  }

  const details = {};

  const bookingMatch = text.match(/booking on\s+([^,]+),\s*([0-9: ]+[APMapm]{2})/i);
  if (bookingMatch) {
    details.bookingDate = bookingMatch[1].trim();
    details.bookingTime = bookingMatch[2].trim().toUpperCase();
    details.time = buildDatetimeLocal(details.bookingDate, details.bookingTime);
  }

  const guestsMatch = text.match(/for\s+(\d+)\s+guest/i);
  if (guestsMatch) {
    details.peopleGoing = guestsMatch[1];
  }

  const venueMatch = text.match(/at\s+(.+?)\s+with offer/i);
  const venueFallback = text.match(/at\s+(.+?)\.\s*please reach/i);
  const venueRaw = (venueMatch?.[1] || venueFallback?.[1] || "").trim();
  if (venueRaw) {
    const parts = venueRaw.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length) {
      details.restaurantName = parts[0];
      details.location = parts.slice(1).join(", ");
    }
  }

  const offerMatch = text.match(/with offer\s+(.+?)(?:\.|please reach|checkout)/i);
  if (offerMatch) {
    details.offer = offerMatch[1].trim();
  }

  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    details.swiggyUrl = urlMatch[0].trim().replace(/[),.;]+$/, "");
    const swiggyLinkInfo = parseSwiggyLink(details.swiggyUrl);
    if (swiggyLinkInfo.restaurantId) {
      details.restaurantId = swiggyLinkInfo.restaurantId;
    }
  }

  return details;
}

function sanitizeSvgText(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

async function searchGooglePlace(name, location) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return null;
  }

  const textQuery = [name, location, "restaurant"].filter(Boolean).join(" ");
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.rating,places.photos,places.primaryTypeDisplayName"
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: 1
    })
  });

  if (!response.ok) {
    throw new Error(`Google Places lookup failed (${response.status})`);
  }

  const payload = await response.json();
  return payload.places?.[0] || null;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/invite", (req, res) => {
  const payload = req.body;

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  let id = generateId();
  while (inviteStore[id]) {
    id = generateId();
  }

  inviteStore[id] = payload;
  saveStore();

  return res.json({ id });
});

app.get("/api/invite/:id", (req, res) => {
  const { id } = req.params;
  const data = inviteStore[id];
  if (!data) {
    return res.status(404).json({ error: "Invite not found" });
  }
  return res.json(data);
});

app.get("/api/extract-swiggy", (req, res) => {
  const rawUrl = String(req.query.url || "");
  if (!rawUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  const parsed = parseSwiggyLink(rawUrl);
  return res.json(parsed);
});

app.post("/api/parse-booking-text", (req, res) => {
  const text = String(req.body?.text || "");
  if (!text.trim()) {
    return res.status(400).json({ error: "Missing booking text in request body" });
  }
  const parsed = parseBookingText(text);
  return res.json(parsed);
});

app.get("/api/google-image", async (req, res) => {
  const name = String(req.query.name || "").trim();
  const location = String(req.query.location || "").trim();

  if (!name) {
    return res.status(400).json({ error: "Missing name parameter" });
  }

  try {
    const place = await searchGooglePlace(name, location);
    if (place) {
      const photoName = place.photos?.[0]?.name || "";
      if (photoName) {
        return res.json({
          source: "google-places",
          name: place.displayName?.text || name,
          location: place.formattedAddress || location,
          rating: place.rating || "",
          cuisine: place.primaryTypeDisplayName?.text || "",
          imageUrl: `/api/place-photo?photoName=${encodeURIComponent(photoName)}`
        });
      }
    }
  } catch (error) {
    console.error(error.message);
  }

  const fallbackUrl = pickFallbackImage(`${name}-${location}`);
  return res.json({
    source: "unsplash-fallback",
    name,
    location,
    imageUrl: fallbackUrl
  });
});

app.get("/api/place-photo", async (req, res) => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const photoName = String(req.query.photoName || "");

  if (!key) {
    return res.status(400).json({ error: "Missing GOOGLE_PLACES_API_KEY on server" });
  }
  if (!photoName) {
    return res.status(400).json({ error: "Missing photoName parameter" });
  }

  try {
    const photoEndpoint = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1280&skipHttpRedirect=true`;
    const response = await fetch(photoEndpoint, {
      headers: { "X-Goog-Api-Key": key }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: "Unable to load photo from Google Places." });
    }

    const payload = await response.json();
    if (!payload.photoUri) {
      return res.status(404).json({ error: "Photo URI not available for this place." });
    }

    return res.redirect(payload.photoUri);
  } catch {
    return res.status(500).json({ error: "Could not fetch place photo." });
  }
});

app.get("/api/og.svg", (req, res) => {
  const name = sanitizeSvgText(req.query.name || "Dinner Invite");
  const cuisine = sanitizeSvgText(req.query.cuisine || "Modern Indian");
  const location = sanitizeSvgText(req.query.location || "Hyderabad");
  const time = sanitizeSvgText(req.query.time || "Tonight 8:00 PM");

  const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F172A"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="cardTop" x1="200" y1="120" x2="890" y2="540" gradientUnits="userSpaceOnUse">
      <stop stop-color="#334155"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="140" r="190" fill="#fb923c" fill-opacity="0.2"/>
  <circle cx="180" cy="520" r="210" fill="#22d3ee" fill-opacity="0.16"/>
  <g transform="translate(270,120) rotate(-6)">
    <rect x="22" y="42" width="630" height="360" rx="36" fill="#0b1225" fill-opacity="0.65"/>
    <rect x="0" y="0" width="630" height="360" rx="36" fill="url(#cardTop)" stroke="#ffffff" stroke-opacity="0.2"/>
    <text x="40" y="100" fill="#F8FAFC" font-family="Sora, sans-serif" font-size="56" font-weight="600">${name}</text>
    <text x="40" y="156" fill="#fcd34d" font-family="Manrope, sans-serif" font-size="30">${cuisine}</text>
    <text x="40" y="212" fill="#cbd5e1" font-family="Manrope, sans-serif" font-size="28">${location}</text>
    <text x="40" y="260" fill="#cbd5e1" font-family="Manrope, sans-serif" font-size="28">${time}</text>
  </g>
  <text x="76" y="88" fill="#FDE68A" font-family="Manrope, sans-serif" font-size="28" letter-spacing="3">INVITE STACK</text>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  return res.send(svg);
});

app.listen(port, () => {
  console.log(`Invite Stack server running on http://localhost:${port}`);
});
