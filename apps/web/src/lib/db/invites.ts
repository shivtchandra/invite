import type { CreateInviteInput, UpdateInviteInput } from "@invite/shared";
import { getDbPool } from "./client";
import { generateSlug } from "../slug";
import { parseBookingText } from "../parsing/booking";

const DEFAULT_CREATOR_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_CREATOR_EMAIL = "system@invite.local";

export type InviteModel = {
  id: string;
  slug: string;
  visibility: "PUBLIC" | "PRIVATE";
  status: string;
  enrichmentStatus: string;
  restaurantName: string;
  location: string | null;
  cuisine: string | null;
  rating: number | null;
  time: string | null;
  peopleGoing: number;
  offer: string | null;
  note: string | null;
  swiggyUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToInvite(row: Record<string, unknown>): InviteModel {
  return {
    id: String(row.id),
    slug: String(row.slug),
    visibility: String(row.visibility) as "PUBLIC" | "PRIVATE",
    status: String(row.status),
    enrichmentStatus: String(row.enrichment_status),
    restaurantName: String(row.restaurant_name),
    location: row.location_text ? String(row.location_text) : null,
    cuisine: row.cuisine ? String(row.cuisine) : null,
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    time: row.event_time ? new Date(String(row.event_time)).toISOString() : null,
    peopleGoing: Number(row.people_going || 0),
    offer: row.offer_text ? String(row.offer_text) : null,
    note: row.note ? String(row.note) : null,
    swiggyUrl: row.swiggy_url ? String(row.swiggy_url) : null,
    imageUrl: row.image_url ? String(row.image_url) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

async function ensureDefaultCreator(creatorId?: string) {
  const pool = getDbPool();
  const id = creatorId || DEFAULT_CREATOR_ID;
  const email =
    creatorId && creatorId !== DEFAULT_CREATOR_ID ? `${creatorId}@invite.local` : DEFAULT_CREATOR_EMAIL;

  await pool.query(
    `
    insert into users (id, email, name)
    values ($1::uuid, $2, 'Invite Creator')
    on conflict (id) do nothing
    `,
    [id, email]
  );

  return id;
}

function normalizeTime(value?: string) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

export async function createInvite(input: CreateInviteInput) {
  const pool = getDbPool();
  const creatorId = await ensureDefaultCreator(input.creatorId);
  const parsedBooking = parseBookingText(input.bookingText);
  const manual = input.manual || {};

  const payload = {
    restaurantName: manual.restaurantName || parsedBooking.restaurantName || "Untitled Invite",
    location: manual.location || parsedBooking.location || null,
    cuisine: manual.cuisine || null,
    rating: manual.rating ?? null,
    time: normalizeTime(manual.time) || normalizeTime(parsedBooking.time),
    peopleGoing: manual.peopleGoing ?? parsedBooking.peopleGoing ?? 0,
    offer: manual.offer || parsedBooking.offer || null,
    note: manual.note || null,
    swiggyUrl: manual.swiggyUrl || parsedBooking.swiggyUrl || null,
    imageUrl: manual.imageUrl || null
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = generateSlug(7);
    try {
      const result = await pool.query(
        `
        insert into invites (
          creator_id,
          slug,
          visibility,
          restaurant_name,
          location_text,
          cuisine,
          rating,
          event_time,
          people_going,
          offer_text,
          note,
          swiggy_url,
          image_url,
          booking_text,
          source_payload,
          metadata
        ) values (
          $1::uuid,
          $2,
          $3::invite_visibility,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15::jsonb,
          $16::jsonb
        )
        returning *
        `,
        [
          creatorId,
          slug,
          input.visibility,
          payload.restaurantName,
          payload.location,
          payload.cuisine,
          payload.rating,
          payload.time,
          payload.peopleGoing,
          payload.offer,
          payload.note,
          payload.swiggyUrl,
          payload.imageUrl,
          input.bookingText || null,
          JSON.stringify({ parsedBooking }),
          JSON.stringify({ restaurantId: manual.restaurantId || parsedBooking.restaurantId || null })
        ]
      );

      return rowToInvite(result.rows[0]);
    } catch (error: any) {
      lastError = error;
      if (error?.code !== "23505") {
        throw error;
      }
    }
  }

  throw lastError || new Error("Could not create invite");
}

export async function getInviteBySlug(slug: string) {
  const pool = getDbPool();
  const result = await pool.query("select * from invites where slug = $1 limit 1", [slug]);
  if (!result.rowCount) {
    return null;
  }
  return rowToInvite(result.rows[0]);
}

export async function listInvites(limit = 20) {
  const pool = getDbPool();
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const result = await pool.query(
    "select * from invites order by created_at desc limit $1",
    [safeLimit]
  );
  return result.rows.map((row) => rowToInvite(row));
}

export async function updateInviteBySlug(slug: string, patch: UpdateInviteInput) {
  const pool = getDbPool();
  const existing = await getInviteBySlug(slug);
  if (!existing) {
    return null;
  }

  const merged = {
    restaurantName: patch.restaurantName ?? existing.restaurantName,
    location: patch.location ?? existing.location,
    cuisine: patch.cuisine ?? existing.cuisine,
    rating: patch.rating ?? existing.rating,
    time: patch.time ? normalizeTime(patch.time) : existing.time,
    peopleGoing: patch.peopleGoing ?? existing.peopleGoing,
    offer: patch.offer ?? existing.offer,
    note: patch.note ?? existing.note,
    swiggyUrl: patch.swiggyUrl ?? existing.swiggyUrl,
    imageUrl: patch.imageUrl ?? existing.imageUrl
  };

  const result = await pool.query(
    `
    update invites
    set
      restaurant_name = $2,
      location_text = $3,
      cuisine = $4,
      rating = $5,
      event_time = $6,
      people_going = $7,
      offer_text = $8,
      note = $9,
      swiggy_url = $10,
      image_url = $11,
      updated_at = now()
    where slug = $1
    returning *
    `,
    [
      slug,
      merged.restaurantName,
      merged.location,
      merged.cuisine,
      merged.rating,
      merged.time,
      merged.peopleGoing,
      merged.offer,
      merged.note,
      merged.swiggyUrl,
      merged.imageUrl
    ]
  );

  return rowToInvite(result.rows[0]);
}

