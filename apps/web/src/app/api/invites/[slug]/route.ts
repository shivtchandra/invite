import { updateInviteSchema } from "@invite/shared";
import { NextRequest, NextResponse } from "next/server";
import { getInviteBySlug, updateInviteBySlug } from "@/lib/db/invites";

export const runtime = "nodejs";

type RouteContext = {
  params: { slug: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = context.params;
    const invite = await getInviteBySlug(slug);
    if (!invite) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Invite not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json(invite);
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error?.message || "Failed to fetch invite" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = context.params;
    const body = await request.json();
    const parsed = updateInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update payload",
            details: parsed.error.flatten()
          }
        },
        { status: 400 }
      );
    }

    const invite = await updateInviteBySlug(slug, parsed.data);
    if (!invite) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Invite not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json(invite);
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error?.message || "Failed to update invite" } },
      { status: 500 }
    );
  }
}
