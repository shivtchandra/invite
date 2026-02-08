import { z } from "zod";

export const inviteVisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export const inviteManualSchema = z
  .object({
    restaurantName: z.string().trim().min(1).optional(),
    location: z.string().trim().min(1).optional(),
    cuisine: z.string().trim().optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    time: z.string().datetime().optional(),
    peopleGoing: z.coerce.number().int().min(0).optional(),
    offer: z.string().trim().optional(),
    note: z.string().trim().optional(),
    swiggyUrl: z.string().url().optional(),
    restaurantId: z.string().trim().optional(),
    imageUrl: z.string().url().optional()
  })
  .partial();

export const createInviteSchema = z
  .object({
    bookingText: z.string().trim().min(10).optional(),
    manual: inviteManualSchema.optional(),
    visibility: inviteVisibilitySchema.default("PUBLIC"),
    creatorId: z.string().uuid().optional()
  })
  .refine((value) => value.bookingText || value.manual, {
    message: "Either bookingText or manual payload is required"
  });

export const updateInviteSchema = inviteManualSchema;

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type UpdateInviteInput = z.infer<typeof updateInviteSchema>;

