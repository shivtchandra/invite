import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StackedInviteCards from "./components/StackedInviteCards";

const RELIABLE_PREVIEW_FALLBACK =
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=80";

const DEMO_BOOKINGS = [
  {
    label: "Happy Yard",
    text: "Hey! I have made a booking on 09 Feb 2026, 07:30 PM for 9 guest(s) at The Happy Yard, Jubilee Hills, Hyderabad with offer Flat 20% Off on Total Bill. Please reach on time for a seamless experience and don't forget to pay your restaurant bill via Swiggy Dineout to get the best exclusive restaurant & payment offers on dining day. Checkout the restaurant details here: https://swiggy.onelink.me/BVRZ?af_dp=swiggydiners%3A%2F%2Fdetails%2F1084072%3Fsource%3Dsharing"
  },
  {
    label: "Olive Bistro",
    text: "I have made a booking on 14 Feb 2026, 08:00 PM for 4 guest(s) at Olive Bistro, Hitech City, Hyderabad with offer Flat 15% Off on Food Bill. Checkout the restaurant details here: https://swiggy.onelink.me/BVRZ?af_dp=swiggydiners%3A%2F%2Fdetails%2F1029381%3Fsource%3Dsharing"
  }
];

const DEFAULT_INVITE = {
  restaurantName: "The Happy Yard",
  cuisine: "Contemporary",
  rating: "4.6",
  location: "Jubilee Hills, Hyderabad",
  time: "",
  peopleGoing: "9",
  offer: "Flat 20% Off on Total Bill",
  restaurantId: "1084072",
  swiggyUrl:
    "https://swiggy.onelink.me/BVRZ?af_dp=swiggydiners%3A%2F%2Fdetails%2F1084072%3Fsource%3Dsharing",
  imageUrl: RELIABLE_PREVIEW_FALLBACK,
  imageSource: "mock",
  note: "Be there on time. We are making this a proper night."
};

const SHARE_FIELDS = [
  "restaurantName",
  "cuisine",
  "rating",
  "location",
  "time",
  "peopleGoing",
  "offer",
  "restaurantId",
  "swiggyUrl",
  "imageUrl",
  "note"
];

const COMPACT_FIELD_MAP = {
  r: "restaurantName",
  c: "cuisine",
  rt: "rating",
  l: "location",
  t: "time",
  p: "peopleGoing",
  o: "offer",
  id: "restaurantId",
  n: "note",
  s: "swiggyUrl",
  i: "imageUrl"
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

function parseSwiggyLinkClient(rawUrl) {
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

function parseBookingTextClient(rawText) {
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
    const parsedUrl = parseSwiggyLinkClient(details.swiggyUrl);
    if (parsedUrl.restaurantId) {
      details.restaurantId = parsedUrl.restaurantId;
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

function buildSwiggyUrlFromId(restaurantId) {
  if (!restaurantId) {
    return "";
  }
  const deepLink = `swiggydiners://details/${restaurantId}?source=sharing`;
  return `https://swiggy.onelink.me/BVRZ?af_dp=${encodeURIComponent(deepLink)}`;
}

function packSharePayload(invite) {
  const compact = {};
  const setIfPresent = (shortKey, value) => {
    if (value) {
      compact[shortKey] = value;
    }
  };

  setIfPresent("r", invite.restaurantName);
  setIfPresent("c", invite.cuisine);
  setIfPresent("rt", invite.rating);
  setIfPresent("l", invite.location);
  setIfPresent("t", invite.time);
  setIfPresent("p", invite.peopleGoing);
  setIfPresent("o", invite.offer);
  setIfPresent("id", invite.restaurantId);
  setIfPresent("n", invite.note);

  if (!invite.restaurantId && invite.swiggyUrl) {
    setIfPresent("s", invite.swiggyUrl);
  }
  if (invite.imageUrl && invite.imageUrl !== RELIABLE_PREVIEW_FALLBACK) {
    setIfPresent("i", invite.imageUrl);
  }

  return toBase64Url(JSON.stringify(compact));
}

function unpackSharePayload(compactValue) {
  try {
    const decoded = fromBase64Url(compactValue);
    const payload = JSON.parse(decoded);
    if (!payload || typeof payload !== "object") {
      return {};
    }

    const expanded = {};
    Object.entries(COMPACT_FIELD_MAP).forEach(([shortKey, fullKey]) => {
      if (payload[shortKey]) {
        expanded[fullKey] = payload[shortKey];
      }
    });

    if (!expanded.swiggyUrl && expanded.restaurantId) {
      expanded.swiggyUrl = buildSwiggyUrlFromId(expanded.restaurantId);
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
  const text = `${invite.restaurantName} Invite`;
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
  const isSharedView = Boolean(urlParams.restaurantName);
  const [invite, setInvite] = useState({ ...DEFAULT_INVITE, ...urlParams });
  const [bookingText, setBookingText] = useState(DEMO_BOOKINGS[0].text);
  const [loadingAutofill, setLoadingAutofill] = useState(false);
  const [autoParsing, setAutoParsing] = useState(false);
  const [lastAutoSignature, setLastAutoSignature] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState("Paste booking text. Parsing runs automatically.");
  const inviteRef = useRef(invite);

  useEffect(() => {
    inviteRef.current = invite;
  }, [invite]);

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
      const hasSwiggyUrl = Boolean(currentInvite.swiggyUrl.trim());

      if (!hasBookingText && !hasSwiggyUrl) {
        if (!silent) {
          setStatus("Paste booking text or a Swiggy URL first.");
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
            swiggyUrl: parsedBooking.swiggyUrl || next.swiggyUrl,
            restaurantId: parsedBooking.restaurantId || next.restaurantId
          };
          parseSource = "booking";
        }

        const swiggyUrl = next.swiggyUrl.trim();
        if (swiggyUrl) {
          let extracted = {};
          try {
            const extractRes = await fetch(`/api/extract-swiggy?url=${encodeURIComponent(swiggyUrl)}`);
            if (extractRes.ok) {
              extracted = await extractRes.json();
            }
          } catch {
            extracted = {};
          }

          if (!extracted.restaurantId) {
            extracted = { ...extracted, ...parseSwiggyLinkClient(swiggyUrl) };
          }

          next = {
            ...next,
            restaurantName: extracted.name || next.restaurantName,
            location: extracted.location || next.location,
            cuisine: extracted.cuisine || next.cuisine,
            rating: extracted.rating || next.rating,
            restaurantId: extracted.restaurantId || next.restaurantId
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
          const sourceLabel =
            parseSource === "booking"
              ? "Parsed Swiggy booking text."
              : parseSource === "url"
                ? "Parsed Swiggy URL."
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
    const looksLikeSwiggyBooking =
      /booking on|guest\(s\)|swiggy\.onelink\.me|swiggy\.com\/|restaurant details/i.test(text);

    if (!looksLikeSwiggyBooking || text.length < 35 || text === lastAutoSignature) {
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
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Share link copied.");
    } catch (error) {
      setStatus("Could not copy link. Use the URL bar instead.");
      console.error(error);
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) {
      await handleCopyLink();
      setPreviewOpen(false);
      return;
    }

    try {
      await navigator.share({
        title: `${invite.restaurantName} Invite`,
        text: `${invite.restaurantName} · ${formatDateTime(invite.time)}`,
        url: shareUrl
      });
      setStatus("Invite shared.");
      setPreviewOpen(false);
    } catch {
      setStatus("Share canceled.");
    }
  }

  function applyDemoText(text) {
    setBookingText(text);
    setStatus("Demo message loaded. Auto parsing now...");
  }

  function handleBookingPaste() {
    setStatus("Booking text pasted. Parsing now...");
    setTimeout(() => {
      parseAndFill({ silent: true, trigger: "auto" });
    }, 130);
  }

  function updateField(field, value) {
    setInvite((prev) => ({ ...prev, [field]: value }));
  }

  // Shared view - recipients only see the cards
  if (isSharedView) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center">
        <div className="w-full max-w-lg px-4">
          <StackedInviteCards invite={invitePreview} calendarUrl={calendarUrl} shareUrl={shareUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <header className="mb-8">
          <p className="kicker">Invite Stack</p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-rose-950 sm:text-5xl">
            Make invites feel like a reveal, not a form.
          </h1>
          <p className="mt-2 text-sm text-rose-700">
            Paste booking text once. We parse instantly and stage the invite card stack with proper depth.
          </p>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="glass-panel p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {DEMO_BOOKINGS.map((item) => (
                <button key={item.label} className="demo-chip" onClick={() => applyDemoText(item.text)}>
                  Load {item.label} Mock
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="label">Swiggy Booking Message</span>
                <textarea
                  className="field min-h-32 resize-y"
                  value={bookingText}
                  onChange={(event) => setBookingText(event.target.value)}
                  onPaste={handleBookingPaste}
                  placeholder="Paste full message from Swiggy..."
                />
                <p className="text-xs text-rose-600">
                  {autoParsing ? "Auto parsing booking message..." : "Auto parse triggers in under a second."}
                </p>
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="label">Swiggy URL</span>
                <input
                  className="field"
                  value={invite.swiggyUrl}
                  onChange={(event) => updateField("swiggyUrl", event.target.value)}
                  placeholder="https://swiggy.onelink.me/..."
                />
              </label>

              <label className="space-y-2">
                <span className="label">Restaurant Name</span>
                <input
                  className="field"
                  value={invite.restaurantName}
                  onChange={(event) => updateField("restaurantName", event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="label">Restaurant ID</span>
                <input
                  className="field"
                  value={invite.restaurantId}
                  onChange={(event) => updateField("restaurantId", event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="label">Cuisine</span>
                <input
                  className="field"
                  value={invite.cuisine}
                  onChange={(event) => updateField("cuisine", event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="label">Rating</span>
                <input
                  className="field"
                  value={invite.rating}
                  onChange={(event) => updateField("rating", event.target.value)}
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="label">Location</span>
                <input
                  className="field"
                  value={invite.location}
                  onChange={(event) => updateField("location", event.target.value)}
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
                  placeholder="Flat 20% Off on Total Bill"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="label">Image URL (optional override)</span>
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
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="btn btn-primary" disabled={loadingAutofill} onClick={handleAutofill}>
                {loadingAutofill ? "Working..." : "Parse Again"}
              </button>
              <button className="btn btn-muted" onClick={handleCopyLink}>
                Copy Link
              </button>
              <button className="btn btn-muted" onClick={() => setPreviewOpen(true)}>
                Preview Invite
              </button>
              {invite.swiggyUrl ? (
                <a className="btn btn-muted" href={invite.swiggyUrl} target="_blank" rel="noreferrer">
                  Open Swiggy
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
              <StackedInviteCards invite={invitePreview} calendarUrl={calendarUrl} shareUrl={shareUrl} />
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
                  {invite.restaurantName || "Restaurant Invite"}
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
                <StackedInviteCards invite={invitePreview} calendarUrl={calendarUrl} shareUrl={shareUrl} />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
