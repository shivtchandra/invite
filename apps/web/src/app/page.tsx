export default function HomePage() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "64px 20px" }}>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.15em", color: "#be185d", fontSize: 12 }}>
        Invite Stack
      </p>
      <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "8px 0 16px" }}>Production App Scaffold Ready</h1>
      <p style={{ color: "#831843", maxWidth: 680 }}>
        Next.js app router + API route handlers are now scaffolded. Start by creating invites via{" "}
        <code>POST /api/invites</code> and opening shared pages at <code>/i/:slug</code>.
      </p>
    </main>
  );
}

