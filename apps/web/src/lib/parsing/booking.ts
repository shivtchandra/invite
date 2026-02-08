export type ParsedBooking = {
  restaurantName?: string;
  location?: string;
  time?: string;
  peopleGoing?: number;
  offer?: string;
  restaurantId?: string;
  swiggyUrl?: string;
};

function buildDatetimeLocal(dateText?: string, timeText?: string) {
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

function extractRestaurantId(value?: string) {
  if (!value) {
    return "";
  }
  const match = value.match(/details\/(\d+)/i);
  return match ? match[1] : "";
}

export function parseSwiggyLink(rawUrl?: string) {
  if (!rawUrl) {
    return {};
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname.includes("swiggy.onelink.me")) {
      const afDpRaw = parsed.searchParams.get("af_dp") || parsed.searchParams.get("deep_link_value") || "";
      const decodedDeepLink = afDpRaw ? decodeURIComponent(afDpRaw) : "";
      return {
        restaurantId: extractRestaurantId(decodedDeepLink),
        deepLink: decodedDeepLink
      };
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const restaurantId = segments
      .slice()
      .reverse()
      .find((segment) => /^\d+$/.test(segment));
    return { restaurantId: restaurantId || "" };
  } catch {
    return {};
  }
}

export function parseBookingText(rawText?: string): ParsedBooking {
  const text = String(rawText || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return {};
  }

  const details: ParsedBooking = {};

  const bookingMatch = text.match(/booking on\s+([^,]+),\s*([0-9: ]+[APMapm]{2})/i);
  if (bookingMatch) {
    const time = buildDatetimeLocal(bookingMatch[1].trim(), bookingMatch[2].trim().toUpperCase());
    if (time) {
      details.time = time;
    }
  }

  const guestsMatch = text.match(/for\s+(\d+)\s+guest/i);
  if (guestsMatch) {
    details.peopleGoing = Number(guestsMatch[1]);
  }

  const venueMatch = text.match(/at\s+(.+?)\s+with offer/i);
  const venueFallback = text.match(/at\s+(.+?)\.\s*please reach/i);
  const venueRaw = (venueMatch?.[1] || venueFallback?.[1] || "").trim();
  if (venueRaw) {
    const parts = venueRaw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
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
    const swiggyUrl = urlMatch[0].trim().replace(/[),.;]+$/, "");
    details.swiggyUrl = swiggyUrl;
    const linkData = parseSwiggyLink(swiggyUrl);
    if (linkData.restaurantId) {
      details.restaurantId = linkData.restaurantId;
    }
  }

  return details;
}

