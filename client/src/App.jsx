import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LandingPage from "./components/LandingPage";
import StackedInviteCards from "./components/StackedInviteCards";

const RELIABLE_PREVIEW_FALLBACK =
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=80";

const DEMO_BOOKINGS = [
  {
    label: "Swiggy: Happy Yard",
    source: "swiggy",
    text: "Hey! I have made a booking on 09 Feb 2026, 07:30 PM for 9 guest(s) at The Happy Yard, Jubilee Hills, Hyderabad with offer Flat 20% Off on Total Bill. Please reach on time for a seamless experience and don't forget to pay your restaurant bill via Swiggy Dineout to get the best exclusive restaurant & payment offers on dining day. Checkout the restaurant details here: https://swiggy.onelink.me/BVRZ?af_dp=swiggydiners%3A%2F%2Fdetails%2F1084072%3Fsource%3Dsharing"
  },
  {
    label: "Zomato: Farzi Cafe",
    source: "zomato",
    text: "Table booked at Farzi Cafe, Jubilee Hills, Hyderabad for 6 guests on 15 Feb 2026 at 8:00 PM. Zomato Gold: 1+1 on drinks. https://www.zomato.com/hyderabad/farzi-cafe-jubilee-hills"
  }
];

const DEFAULT_INVITE = {
  senderName: "",
  restaurantName: "",
  cuisine: "",
  rating: "",
  location: "",
  time: "",
  peopleGoing: "",
  offer: "",
  restaurantId: "",
  menuUrl: "",
  imageUrl: "",
  imageSource: "",
  note: "",
  source: "manual",
  customCards: []
};

const SHARE_FIELDS = [
  "senderName",
  "restaurantName",
  "cuisine",
  "rating",
  "location",
  "time",
  "peopleGoing",
  "offer",
  "restaurantId",
  "menuUrl",
  "imageUrl",
  "note",
  "source"
];

const COMPACT_FIELD_MAP = {
  sn: "senderName",
  r: "restaurantName",
  c: "cuisine",
  rt: "rating",
  l: "location",
  t: "time",
  p: "peopleGoing",
  o: "offer",
  id: "restaurantId",
  n: "note",
  u: "menuUrl",
  s: "swiggyUrl",
  i: "imageUrl",
  src: "source",
  cc: "customCards"
};

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

function toTitleCase(value) {
  return String(value || "")
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t[0].toUpperCase() + t.slice(1))
    .join(" ");
}

function detectSource(text) {
  const t = String(text || "").toLowerCase();
  if (/swiggy\.onelink\.me|swiggy\.com|swiggydiners|swiggy dineout/i.test(t)) return "swiggy";
  if (/zomato\.com|zomato gold|zomato pro/i.test(t)) return "zomato";
  if (/dineout\.co\.in|dineout/i.test(t)) return "dineout";
  if (/https?:\/\//.test(t)) return "other";
  return "manual";
}

function parseLinkClient(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Swiggy onelink deep links
    if (hostname.includes("swiggy.onelink.me")) {
      const afDpRaw = parsed.searchParams.get("af_dp") || parsed.searchParams.get("deep_link_value") || "";
      const decodedDeepLink = afDpRaw ? decodeURIComponent(afDpRaw) : "";
      return {
        source: "swiggy",
        restaurantId: extractRestaurantId(decodedDeepLink),
        deepLink: decodedDeepLink
      };
    }

    // Zomato URLs
    if (hostname.includes("zomato.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const slug = segments.find((s) => s.includes("-") && s !== "city") || "";
      const tokens = slug.split("-").filter((t) => !/^\d+$/.test(t));
      const name = toTitleCase(tokens.slice(0, Math.ceil(tokens.length * 0.6)).join(" "));
      const location = toTitleCase(segments[0] || "");
      return { source: "zomato", restaurantName: name, location, restaurantId: "" };
    }

    // Dineout URLs
    if (hostname.includes("dineout.co.in") || hostname.includes("dineout.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const slug = segments.find((s) => s.includes("-")) || "";
      const tokens = slug.split("-").filter((t) => !/^\d+$/.test(t));
      const name = toTitleCase(tokens.join(" "));
      return { source: "dineout", restaurantName: name, restaurantId: "" };
    }

    // Swiggy direct URLs
    if (hostname.includes("swiggy.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const restaurantId = segments.slice().reverse().find((s) => /^\d+$/.test(s));
      return { source: "swiggy", restaurantId: restaurantId || "" };
    }

    // Generic URL
    const segments = parsed.pathname.split("/").filter(Boolean);
    const restaurantId = segments.slice().reverse().find((s) => /^\d+$/.test(s));
    return { source: "other", restaurantId: restaurantId || "" };
  } catch {
    return {};
  }
}

function parseBookingTextClient(rawText) {
  const text = String(rawText || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return {};
  }

  const details = {};
  details.source = detectSource(text);

  // Swiggy-style: "booking on 09 Feb 2026, 07:30 PM"
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

  // Swiggy venue: "at Restaurant, Location with offer"
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

  // Zomato-style venue: "Table booked at Farzi Cafe, Jubilee Hills for 6 guests"
  if (!details.restaurantName) {
    const zomatoVenue = text.match(/(?:table (?:booked|reserved) at|booked at)\s+(.+?)(?:\s+for\s+\d+|\s+on\s+)/i);
    if (zomatoVenue) {
      const parts = zomatoVenue[1].split(",").map((p) => p.trim()).filter(Boolean);
      details.restaurantName = parts[0];
      details.location = parts.slice(1).join(", ");
    }
  }

  const offerMatch = text.match(/with offer\s+(.+?)(?:\.|please reach|checkout)/i);
  if (offerMatch) {
    details.offer = offerMatch[1].trim();
  }

  // Zomato Gold/Pro offers
  if (!details.offer) {
    const zomatoOffer = text.match(/(zomato (?:gold|pro)[^.]*)/i);
    if (zomatoOffer) {
      details.offer = zomatoOffer[1].trim();
    }
  }

  // Generic date/time fallback: "on 15 Feb 2026 at 8:00 PM"
  if (!details.time) {
    const dateTimeMatch = text.match(/on\s+(\d{1,2}\s+\w+\s+\d{4})[,\s]+(?:at\s+)?(\d{1,2}:\d{2}\s*[APMapm]{2})/i);
    if (dateTimeMatch) {
      details.time = buildDatetimeLocal(dateTimeMatch[1].trim(), dateTimeMatch[2].trim().toUpperCase());
    }
  }

  // Generic URL extraction
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    details.menuUrl = urlMatch[0].trim().replace(/[),.;]+$/, "");
    const parsedUrl = parseLinkClient(details.menuUrl);
    if (parsedUrl.restaurantId) {
      details.restaurantId = parsedUrl.restaurantId;
    }
    if (parsedUrl.restaurantName && !details.restaurantName) {
      details.restaurantName = parsedUrl.restaurantName;
    }
    if (parsedUrl.location && !details.location) {
      details.location = parsedUrl.location;
    }
    if (parsedUrl.source) {
      details.source = parsedUrl.source;
    }
  }

  return details;
}

function toBase64Url(input) {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function packSharePayload(invite) {
  // Helper: strip query params from image URLs to save space
  const stripImageParams = (url) => {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url;
    }
  };

  // Helper: convert datetime to Unix timestamp (seconds)
  const toTimestamp = (datetime) => {
    if (!datetime) return null;
    try {
      return Math.floor(new Date(datetime).getTime() / 1000).toString();
    } catch {
      return datetime;
    }
  };

  // Helper: convert source to single character
  const sourceToCode = (src) => {
    const map = { swiggy: "s", zomato: "z", dineout: "d", manual: "m", other: "o" };
    return map[src] || "m";
  };

  // Use array-based encoding (version 2) for maximum compression
  // Format: [version, senderName, restaurantName, cuisine, rating, location, timestamp, people, offer, restaurantId, note, menuUrl, sourceCode, imageUrl, customCards]
  const arr = [
    "2", // version marker
    invite.senderName || "",
    invite.restaurantName || "",
    invite.cuisine || "",
    invite.rating || "",
    invite.location || "",
    toTimestamp(invite.time) || "",
    invite.peopleGoing || "",
    invite.offer || "",
    invite.restaurantId || "",
    invite.note || "",
    invite.menuUrl || "",
    sourceToCode(invite.source),
    (invite.imageUrl && invite.imageUrl !== RELIABLE_PREVIEW_FALLBACK) ? stripImageParams(invite.imageUrl) : "",
    invite.customCards?.length ? JSON.stringify(invite.customCards) : ""
  ];

  return toBase64Url(JSON.stringify(arr));
}

function unpackSharePayload(compactValue) {
  try {
    const decoded = fromBase64Url(compactValue);
    const payload = JSON.parse(decoded);
    if (!payload || typeof payload !== "object") {
      return {};
    }

    // Helper: convert Unix timestamp back to ISO datetime
    const fromTimestamp = (ts) => {
      if (!ts) return "";
      try {
        const num = parseInt(ts, 10);
        if (isNaN(num)) return ts;
        const date = new Date(num * 1000);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch {
        return ts;
      }
    };

    // Helper: convert single character back to source name
    const codeToSource = (code) => {
      const map = { s: "swiggy", z: "zomato", d: "dineout", m: "manual", o: "other" };
      return map[code] || code;
    };

    // Check if this is the new array-based format (version 2)
    if (Array.isArray(payload) && payload[0] === "2") {
      const [
        version,
        senderName,
        restaurantName,
        cuisine,
        rating,
        location,
        timestamp,
        peopleGoing,
        offer,
        restaurantId,
        note,
        menuUrl,
        sourceCode,
        imageUrl,
        customCardsJson
      ] = payload;

      const expanded = {};
      if (senderName) expanded.senderName = senderName;
      if (restaurantName) expanded.restaurantName = restaurantName;
      if (cuisine) expanded.cuisine = cuisine;
      if (rating) expanded.rating = rating;
      if (location) expanded.location = location;
      if (timestamp) expanded.time = fromTimestamp(timestamp);
      if (peopleGoing) expanded.peopleGoing = peopleGoing;
      if (offer) expanded.offer = offer;
      if (restaurantId) expanded.restaurantId = restaurantId;
      if (note) expanded.note = note;
      if (menuUrl) expanded.menuUrl = menuUrl;
      if (sourceCode) expanded.source = codeToSource(sourceCode);
      if (imageUrl) expanded.imageUrl = imageUrl;
      if (customCardsJson) {
        try {
          expanded.customCards = JSON.parse(customCardsJson);
        } catch {
          expanded.customCards = [];
        }
      }

      return expanded;
    }

    // Backward compatibility: handle old object-based format
    const expanded = {};
    Object.entries(COMPACT_FIELD_MAP).forEach(([shortKey, fullKey]) => {
      if (payload[shortKey]) {
        expanded[fullKey] = payload[shortKey];
      }
    });

    // Backward compat: old links used swiggyUrl (key "s")
    if (!expanded.menuUrl && expanded.swiggyUrl) {
      expanded.menuUrl = expanded.swiggyUrl;
      if (!expanded.source) {
        expanded.source = "swiggy";
      }
    }
    delete expanded.swiggyUrl;

    // Parse customCards from JSON string
    if (typeof expanded.customCards === "string") {
      try {
        expanded.customCards = JSON.parse(expanded.customCards);
      } catch {
        expanded.customCards = [];
      }
    }

    return expanded;
  } catch {
    return {};
  }
}

function readInviteFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const compact = params.get("d");
  if (compact) {
    const decoded = unpackSharePayload(compact);
    if (Object.keys(decoded).length) {
      return decoded;
    }
  }

  const next = {};
  SHARE_FIELDS.forEach((field) => {
    const value = params.get(field);
    if (value) {
      next[field] = value;
    }
  });

  if (!next.time) {
    const bookingDate = params.get("bookingDate");
    const bookingTime = params.get("bookingTime");
    const fallbackTime = buildDatetimeLocal(bookingDate, bookingTime);
    if (fallbackTime) {
      next.time = fallbackTime;
    }
  }

  // Backward compat: old links used swiggyUrl
  const legacySwiggyUrl = params.get("swiggyUrl");
  if (!next.menuUrl && legacySwiggyUrl) {
    next.menuUrl = legacySwiggyUrl;
    if (!next.source) {
      next.source = "swiggy";
    }
  }

  return next;
}

function formatDateTime(datetimeValue) {
  if (!datetimeValue) {
    return "Tonight · 8:00 PM";
  }

  const date = new Date(datetimeValue);
  if (Number.isNaN(date.getTime())) {
    return "Tonight · 8:00 PM";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function toCalendarUrl(invite) {
  if (!invite.time) {
    return "";
  }

  const start = new Date(invite.time);
  if (Number.isNaN(start.getTime())) {
    return "";
  }

  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const text = `${invite.restaurantName || "Event"} Invite`;
  const details = [
    `Cuisine: ${invite.cuisine || "NA"}`,
    `Rating: ${invite.rating || "NA"}`,
    `Offer: ${invite.offer || "No offer listed"}`,
    `Plan: ${invite.note || ""}`
  ].join("\n");

  const toCompact = (d) => d.toISOString().replace(/-|:|\.\d{3}/g, "");
  const dates = `${toCompact(start)}/${toCompact(end)}`;

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", text);
  url.searchParams.set("details", details);
  url.searchParams.set("location", invite.location || "");
  url.searchParams.set("dates", dates);
  return url.toString();
}

export default function App() {
  const urlParams = readInviteFromUrl();
  const searchParams = new URLSearchParams(window.location.search);
  const hasShortId = searchParams.has("i");
  const hasCompactData = searchParams.has("d");
  const isSharedView = Boolean(urlParams.restaurantName) || hasShortId || hasCompactData;

  const [invite, setInvite] = useState({ ...DEFAULT_INVITE, ...urlParams });
  // Only show loading spinner if we have a short ID but no inline compact data
  const [loadingInvite, setLoadingInvite] = useState(hasShortId && !hasCompactData);

  const [bookingText, setBookingText] = useState("");
  const [loadingAutofill, setLoadingAutofill] = useState(false);
  const [autoParsing, setAutoParsing] = useState(false);
  const [lastAutoSignature, setLastAutoSignature] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState("Paste booking text. Parsing runs automatically.");
  const [showLanding, setShowLanding] = useState(!isSharedView);
  const inviteRef = useRef(invite);

  useEffect(() => {
    inviteRef.current = invite;
  }, [invite]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get("i");
    if (inviteId) {
      // If we already have data from ?d= param, just try to refresh from server silently
      const alreadyHasData = Boolean(invite.restaurantName || invite.senderName);
      if (!alreadyHasData) {
        setStatus("Loading shared invite...");
      }
      fetch(`/api/invite/${inviteId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Invite not found");
          return res.json();
        })
        .then((data) => {
          console.log("[Short Link] Loaded invite data:", data);
          // Normalize old swiggyUrl to menuUrl
          if (data.swiggyUrl && !data.menuUrl) {
            data.menuUrl = data.swiggyUrl;
            data.source = data.source || "swiggy";
            delete data.swiggyUrl;
          }
          setInvite({ ...DEFAULT_INVITE, ...data });
          if (!alreadyHasData) {
            setStatus("Invite loaded from short link.");
          }
        })
        .catch((err) => {
          console.error("[Short Link] Fetch failed:", err);
          if (!alreadyHasData) {
            setStatus("Could not load invite. It may have expired.");
          }
          // If we have ?d= data, we're already showing the invite — no problem
        })
        .finally(() => {
          setLoadingInvite(false);
        });
    }
  }, []);

  async function getShortLink() {
    // Always include ?d= compact payload as a reliable fallback
    const compactPayload = packSharePayload(invite);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invite)
      });
      if (!res.ok) throw new Error("Failed to shorten link");
      const { id } = await res.json();
      const url = new URL(window.location.origin);
      url.searchParams.set("i", id);
      url.searchParams.set("d", compactPayload);
      return url.toString();
    } catch (e) {
      console.error(e);
      return shareUrl;
    }
  }

  useEffect(() => {
    if (invite.time || isSharedView) {
      return;
    }
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const local = new Date(oneHourFromNow.getTime() - oneHourFromNow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setInvite((prev) => ({ ...prev, time: local }));
  }, [invite.time]);

  const invitePreview = useMemo(
    () => ({
      ...invite,
      timeLabel: formatDateTime(invite.time)
    }),
    [invite]
  );

  const shareUrl = useMemo(() => {
    const url = new URL(window.location.origin);
    url.searchParams.set("d", packSharePayload(invite));
    return url.toString();
  }, [invite]);

  const calendarUrl = useMemo(() => toCalendarUrl(invite), [invite]);

  const parseAndFill = useCallback(
    async ({ silent = false, trigger = "manual" } = {}) => {
      const currentInvite = { ...inviteRef.current };
      const hasBookingText = Boolean(bookingText.trim());
      const hasMenuUrl = Boolean(currentInvite.menuUrl?.trim());

      if (!hasBookingText && !hasMenuUrl) {
        if (!silent) {
          setStatus("Paste booking text or a restaurant link first.");
        }
        return false;
      }

      if (!silent) {
        setStatus("Parsing booking details and building your invite...");
      }

      try {
        let next = { ...currentInvite };
        let parseSource = "";

        if (hasBookingText) {
          let parsedBooking = {};
          try {
            const bookingRes = await fetch("/api/parse-booking-text", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: bookingText })
            });
            if (bookingRes.ok) {
              parsedBooking = await bookingRes.json();
            }
          } catch {
            parsedBooking = {};
          }

          if (!parsedBooking.time && !parsedBooking.restaurantName) {
            parsedBooking = parseBookingTextClient(bookingText);
          }

          next = {
            ...next,
            restaurantName: parsedBooking.restaurantName || next.restaurantName,
            location: parsedBooking.location || next.location,
            time: parsedBooking.time || next.time,
            peopleGoing: parsedBooking.peopleGoing || next.peopleGoing,
            offer: parsedBooking.offer || next.offer,
            menuUrl: parsedBooking.menuUrl || next.menuUrl,
            restaurantId: parsedBooking.restaurantId || next.restaurantId,
            source: parsedBooking.source || next.source
          };
          parseSource = "booking";
        }

        const menuUrl = (next.menuUrl || "").trim();
        if (menuUrl) {
          let extracted = {};
          try {
            const extractRes = await fetch(`/api/extract-link?url=${encodeURIComponent(menuUrl)}`);
            if (extractRes.ok) {
              extracted = await extractRes.json();
            }
          } catch {
            extracted = {};
          }

          if (!extracted.restaurantId) {
            extracted = { ...extracted, ...parseLinkClient(menuUrl) };
          }

          next = {
            ...next,
            restaurantName: extracted.name || extracted.restaurantName || next.restaurantName,
            location: extracted.location || next.location,
            cuisine: extracted.cuisine || next.cuisine,
            rating: extracted.rating || next.rating,
            restaurantId: extracted.restaurantId || next.restaurantId,
            source: extracted.source || next.source
          };
          if (!parseSource) {
            parseSource = "url";
          }
        }

        if (next.restaurantName?.trim()) {
          const imageRes = await fetch(
            `/api/google-image?name=${encodeURIComponent(next.restaurantName)}&location=${encodeURIComponent(
              next.location || ""
            )}`
          );
          const imageData = imageRes.ok ? await imageRes.json() : null;

          if (imageData?.imageUrl) {
            next.imageUrl = imageData.imageUrl;
            next.imageSource = imageData.source || "";
          }
        }

        setInvite(next);
        inviteRef.current = next;

        if (!silent) {
          const sourceName = next.source && next.source !== "manual" && next.source !== "other"
            ? next.source.charAt(0).toUpperCase() + next.source.slice(1)
            : "";
          const sourceLabel =
            parseSource === "booking"
              ? `Parsed ${sourceName || "booking"} text.`
              : parseSource === "url"
                ? `Parsed ${sourceName || ""} URL.`.replace("  ", " ")
                : "Autofill complete.";

          if (next.restaurantId) {
            setStatus(`${sourceLabel} Restaurant ID: ${next.restaurantId}`);
          } else {
            setStatus(sourceLabel);
          }
        } else if (trigger === "auto") {
          setStatus("Auto-parsed booking details. Invite reveal updated.");
        }

        return true;
      } catch (error) {
        if (!silent) {
          setStatus("Autofill failed. You can still edit details manually.");
        }
        console.error(error);
        return false;
      }
    },
    [bookingText]
  );

  useEffect(() => {
    const text = bookingText.trim();
    const looksLikeBooking =
      /booking on|guest\(s\)|swiggy\.onelink\.me|swiggy\.com|zomato\.com|dineout\.co\.in|table booked|table reserved|restaurant details/i.test(text);

    if (!looksLikeBooking || text.length < 35 || text === lastAutoSignature) {
      return;
    }

    const timer = setTimeout(async () => {
      setAutoParsing(true);
      const parsed = await parseAndFill({ silent: true, trigger: "auto" });
      setAutoParsing(false);
      if (parsed) {
        setLastAutoSignature(text);
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [bookingText, lastAutoSignature, parseAndFill]);

  useEffect(() => {
    if (!previewOpen) {
      return;
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  async function handleAutofill() {
    setLoadingAutofill(true);
    await parseAndFill({ silent: false, trigger: "manual" });
    setLoadingAutofill(false);
  }

  async function handleCopyLink() {
    setStatus("Generating share link...");
    const shortUrl = await getShortLink();
    try {
      await navigator.clipboard.writeText(shortUrl);
      setStatus("Short link copied.");
    } catch (error) {
      setStatus("Could not copy link. Use the URL bar instead.");
      console.error(error);
    }
  }

  async function handleNativeShare() {
    const shortUrl = await getShortLink();
    if (!navigator.share) {
      await navigator.clipboard.writeText(shortUrl);
      setStatus("Short link copied.");
      setPreviewOpen(false);
      return;
    }

    try {
      await navigator.share({
        title: `${invite.restaurantName || "Event"} Invite`,
        text: `${invite.restaurantName || "Event"} · ${formatDateTime(invite.time)}`,
        url: shortUrl
      });
      setStatus("Invite shared.");
      setPreviewOpen(false);
    } catch {
      setStatus("Share canceled.");
    }
  }

  function applyDemoText(text, source) {
    setBookingText(text);
    if (source) {
      updateField("source", source);
    }
    setStatus("Demo message loaded. Auto parsing now...");
  }

  function handleBookingPaste() {
    setStatus("Booking text pasted. Parsing now...");
    setTimeout(() => {
      parseAndFill({ silent: true, trigger: "auto" });
    }, 130);
  }

  function updateField(field, value) {
    console.log(`[updateField] ${field}:`, value);
    setInvite((prev) => {
      const updated = { ...prev, [field]: value };
      console.log("[updateField] New invite state:", updated);
      return updated;
    });
  }

  if (showLanding && !isSharedView) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  // Shared view - recipients only see the cards
  if (loadingInvite) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center">
        <p className="animate-pulse text-lg font-medium text-rose-950/80">Loading invite...</p>
      </div>
    );
  }

  if (isSharedView) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center p-4">
        <div className="sender-pill fixed top-8 z-50">
          <span className="pill-dot"></span>
          <span className="pill-text">
            {invite.senderName ? `${invite.senderName}'s Invite` : "Personal Invite"}
            {invite.restaurantName && ` • ${invite.restaurantName}`}
            {invite.time && ` • ${formatDateTime(invite.time)}`}
          </span>
        </div>
        <div className="w-full max-w-lg">
          <StackedInviteCards
            key={`${invite.senderName}-${invite.time}-${invite.restaurantName}`}
            invite={invitePreview}
            calendarUrl={calendarUrl}
            shareUrl={shareUrl}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-rose-100">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-1.5 h-6 bg-rose-500 rounded-full" />
              <p className="kicker !mb-0">Invite Stack</p>
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-rose-950 sm:text-5xl">
              Make invites feel like a <span className="text-rose-500">reveal</span>.
            </h1>
            <p className="mt-3 text-base text-rose-900/40 font-medium">
              We parse your text instantly and stage the invite card stack with proper depth.
            </p>
          </div>

          <button
            onClick={() => setShowLanding(true)}
            className="group shrink-0 flex items-center gap-2.5 px-6 py-3.5 bg-rose-500 text-white hover:bg-rose-600 transition-all duration-300 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-[0_15px_45px_rgba(225,29,72,0.3)] hover:scale-[1.05] active:scale-95 border border-rose-400/20"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7Z" />
              </svg>
            </div>
            <span>Explore Home</span>
          </button>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="glass-panel p-5 sm:p-6">
            <div className="mb-4">
              <span className="label mb-2 block">Invite Type</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "manual", label: "Custom / Manual" },
                  { key: "swiggy", label: "Swiggy" },
                  { key: "zomato", label: "Zomato" },
                  { key: "dineout", label: "Dineout" },
                  { key: "other", label: "Other Link" }
                ].map((src) => (
                  <button
                    key={src.key}
                    className={`demo-chip ${invite.source === src.key ? "border-rose-500 bg-rose-100 text-rose-800" : ""}`}
                    onClick={() => updateField("source", src.key)}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            {invite.source !== "manual" && (
              <div className="mb-4 flex flex-wrap gap-2">
                {DEMO_BOOKINGS.map((item) => (
                  <button key={item.label} className="demo-chip" onClick={() => applyDemoText(item.text, item.source)}>
                    Load {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="label">Your Name (Sender)</span>
                <input
                  className="field"
                  value={invite.senderName}
                  onChange={(event) => updateField("senderName", event.target.value)}
                  placeholder="Enter your name..."
                />
              </label>

              {invite.source !== "manual" && (
                <label className="space-y-2 sm:col-span-2">
                  <span className="label">Booking Message</span>
                  <textarea
                    className="field min-h-32 resize-y"
                    value={bookingText}
                    onChange={(event) => setBookingText(event.target.value)}
                    onPaste={handleBookingPaste}
                    placeholder="Paste booking message from Swiggy, Zomato, Dineout, or any platform..."
                  />
                  <p className="text-xs text-rose-600">
                    {autoParsing ? "Auto parsing booking message..." : "Auto parse triggers in under a second."}
                  </p>
                </label>
              )}

              {invite.source !== "manual" && (
                <label className="space-y-2 sm:col-span-2">
                  <span className="label">Restaurant / Booking Link</span>
                  <input
                    className="field"
                    value={invite.menuUrl}
                    onChange={(event) => updateField("menuUrl", event.target.value)}
                    placeholder="https://... (Swiggy, Zomato, Dineout, or any URL)"
                  />
                </label>
              )}

              <label className="space-y-2">
                <span className="label">{invite.source === "manual" ? "Venue / Event Name" : "Restaurant Name"}</span>
                <input
                  className="field"
                  value={invite.restaurantName}
                  onChange={(event) => updateField("restaurantName", event.target.value)}
                  placeholder={invite.source === "manual" ? "e.g. House Party, Rooftop BBQ..." : ""}
                />
              </label>

              {invite.source !== "manual" && (
                <label className="space-y-2">
                  <span className="label">Restaurant ID</span>
                  <input
                    className="field"
                    value={invite.restaurantId}
                    onChange={(event) => updateField("restaurantId", event.target.value)}
                  />
                </label>
              )}

              <label className="space-y-2">
                <span className="label">Cuisine</span>
                <input
                  className="field"
                  value={invite.cuisine}
                  onChange={(event) => updateField("cuisine", event.target.value)}
                  placeholder={invite.source === "manual" ? "e.g. BBQ, Italian, Homemade..." : ""}
                />
              </label>

              {invite.source !== "manual" && (
                <label className="space-y-2">
                  <span className="label">Rating</span>
                  <input
                    className="field"
                    value={invite.rating}
                    onChange={(event) => updateField("rating", event.target.value)}
                  />
                </label>
              )}

              <label className="space-y-2 sm:col-span-2">
                <span className="label">Location</span>
                <input
                  className="field"
                  value={invite.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  placeholder={invite.source === "manual" ? "e.g. My place, 42 Oak Street..." : ""}
                />
              </label>

              <label className="space-y-2">
                <span className="label">Time</span>
                <input
                  type="datetime-local"
                  className="field"
                  value={invite.time}
                  onChange={(event) => updateField("time", event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="label">People Going</span>
                <input
                  className="field"
                  value={invite.peopleGoing}
                  onChange={(event) => updateField("peopleGoing", event.target.value)}
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="label">Offer</span>
                <input
                  className="field"
                  value={invite.offer}
                  onChange={(event) => updateField("offer", event.target.value)}
                  placeholder={invite.source === "manual" ? "e.g. BYOB, Potluck, Dress code..." : "Flat 20% Off on Total Bill"}
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="label">Image URL (optional)</span>
                <input
                  className="field"
                  value={invite.imageUrl}
                  onChange={(event) => updateField("imageUrl", event.target.value)}
                  placeholder="https://images..."
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="label">Invite Note</span>
                <textarea
                  className="field min-h-24 resize-none"
                  value={invite.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder={invite.source === "manual" ? "Add details about your event, dress code, what to bring..." : ""}
                />
              </label>
            </div>

            <div className="mt-4 border-t border-rose-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="label">Custom Cards</span>
                <button
                  className="demo-chip"
                  onClick={() => {
                    const newCard = {
                      id: `custom-${Date.now()}`,
                      title: "",
                      body: ""
                    };
                    updateField("customCards", [...(invite.customCards || []), newCard]);
                  }}
                >
                  + Add Card
                </button>
              </div>
              {(invite.customCards || []).length === 0 && (
                <p className="text-xs text-rose-500/70">Add custom cards to include extra info in your invite stack.</p>
              )}
              {(invite.customCards || []).map((card, idx) => (
                <div key={card.id} className="mb-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-rose-600">Card {idx + 1}</span>
                    <button
                      className="text-xs text-rose-400 hover:text-rose-600"
                      onClick={() => {
                        updateField(
                          "customCards",
                          invite.customCards.filter((c) => c.id !== card.id)
                        );
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    className="field mb-2"
                    placeholder="Card title..."
                    value={card.title}
                    onChange={(e) => {
                      const updated = invite.customCards.map((c) =>
                        c.id === card.id ? { ...c, title: e.target.value } : c
                      );
                      updateField("customCards", updated);
                    }}
                  />
                  <textarea
                    className="field min-h-16 resize-y"
                    placeholder="Card body text..."
                    value={card.body}
                    onChange={(e) => {
                      const updated = invite.customCards.map((c) =>
                        c.id === card.id ? { ...c, body: e.target.value } : c
                      );
                      updateField("customCards", updated);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {invite.source !== "manual" && (
                <button className="btn btn-primary" disabled={loadingAutofill} onClick={handleAutofill}>
                  {loadingAutofill ? "Working..." : "Parse Again"}
                </button>
              )}
              <button className="btn btn-muted" onClick={handleCopyLink}>
                Copy Link
              </button>
              <button className="btn btn-muted" onClick={() => setPreviewOpen(true)}>
                Preview Invite
              </button>
              {invite.menuUrl ? (
                <a className="btn btn-muted" href={invite.menuUrl} target="_blank" rel="noreferrer">
                  {invite.source === "swiggy"
                    ? "Open Swiggy"
                    : invite.source === "zomato"
                      ? "Open Zomato"
                      : invite.source === "dineout"
                        ? "Open Dineout"
                        : "Open Link"}
                </a>
              ) : null}
            </div>

            <p className="mt-4 text-sm text-rose-900/80">{status}</p>
            {invite.imageSource ? (
              <p className="mt-1 text-xs uppercase tracking-widest text-rose-600/70">
                Image Source: {invite.imageSource}
              </p>
            ) : null}
          </section>

          <section className="glass-panel flex min-h-[600px] items-center justify-center p-6">
            <div className="w-full">
              <p className="mb-4 text-center text-xs uppercase tracking-[0.18em] text-rose-500">
                Live Invite Reveal
              </p>
              <StackedInviteCards
                key={`main-${invite.senderName}-${invite.time}`}
                invite={invitePreview}
                calendarUrl={calendarUrl}
                shareUrl={shareUrl}
              />
            </div>
          </section>
        </main>
      </div>

      <AnimatePresence>
        {previewOpen ? (
          <motion.div
            className="experience-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              className="experience-shell"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div>
                <p className="label">Invite Experience</p>
                <h3 className="font-display mt-1 text-4xl leading-tight text-rose-950">
                  {invite.restaurantName || "Your Invite"}
                </h3>
                <p className="mt-3 text-base text-rose-700">
                  You are being personally invited. This is the moment your friend should feel the plan is worth
                  showing up for.
                </p>
                <div className="mt-5 space-y-2 text-sm text-rose-900">
                  <p>{formatDateTime(invite.time)}</p>
                  <p>{invite.location || "Location TBD"}</p>
                  <p>{invite.peopleGoing || "0"} guests confirmed</p>
                </div>
                <p className="preview-link mt-4">{shareUrl}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn btn-muted" onClick={() => setPreviewOpen(false)}>
                    Back
                  </button>
                  <button className="btn btn-muted" onClick={handleCopyLink}>
                    Copy Link
                  </button>
                  <button className="btn btn-primary" onClick={handleNativeShare}>
                    Share Now
                  </button>
                </div>
              </div>
              <div className="experience-stack">
                <StackedInviteCards
                  key={`modal-${invite.senderName}-${invite.time}`}
                  invite={invitePreview}
                  calendarUrl={calendarUrl}
                  shareUrl={shareUrl}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
