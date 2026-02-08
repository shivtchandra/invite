import { createInviteSchema } from "@invite/shared";
import { NextRequest, NextResponse } from "next/server";
import { createInvite, listInvites } from "@/lib/db/invites";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") || "20");
    const invites = await listInvites(limit);
    return NextResponse.json({ data: invites });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error?.message || "Failed to list invites" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid create invite payload",
            details: parsed.error.flatten()
          }
        },
        { status: 400 }
      );
    }

    const invite = await createInvite(parsed.data);

    return NextResponse.json(
      {
        id: invite.id,
        slug: invite.slug,
        shareUrl: `${request.nextUrl.origin}/i/${invite.slug}`,
        status: invite.status,
        enrichmentStatus: invite.enrichmentStatus,
        invite
      },
      { status: 201 }
    );
  } catch (error: any) {
    const message = error?.message || "Failed to create invite";
    const status = message.includes("DATABASE_URL") ? 500 : 500;
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message
        }
      },
      { status }
    );
  }
}

