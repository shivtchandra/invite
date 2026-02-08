import { getInviteBySlug } from "@/lib/db/invites";
import { notFound } from "next/navigation";

type InvitePageProps = {
  params: { slug: string };
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { slug } = params;
  const invite = await getInviteBySlug(slug);

  if (!invite || invite.status !== "ACTIVE") {
    notFound();
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 20px" }}>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.16em", color: "#be185d", fontSize: 12 }}>
        You Are Invited
      </p>
      <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "8px 0 16px" }}>{invite.restaurantName}</h1>
      <p style={{ fontSize: 18, color: "#831843", margin: "0 0 10px" }}>{invite.location || "Location TBA"}</p>
      <p style={{ fontSize: 18, color: "#831843", margin: "0 0 10px" }}>
        {invite.time ? new Date(invite.time).toLocaleString() : "Time TBA"}
      </p>
      <p style={{ margin: "0 0 10px" }}>{invite.offer || "No offer attached."}</p>
      <p style={{ margin: "0 0 20px" }}>{invite.note || "See you there."}</p>
      {invite.imageUrl ? (
        <img
          src={invite.imageUrl}
          alt={invite.restaurantName}
          style={{ width: "100%", maxWidth: 620, borderRadius: 16, border: "1px solid #fbcfe8" }}
        />
      ) : null}
    </main>
  );
}
