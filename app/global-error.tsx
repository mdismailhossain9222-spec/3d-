"use client";

export default function GlobalRootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#030303", color: "#f3f3f3", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <main style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 6, color: "#7d7d7d", textTransform: "uppercase" }}>FAISTOF · Critical fault</p>
          <h1 style={{ fontSize: 26, letterSpacing: -0.5, margin: "14px 0 10px" }}>The lights flickered.</h1>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#7d7d7d" }}>
            The application shell failed to render. {error.message ? `(${error.message})` : ""}
          </p>
          <button
            onClick={reset}
            style={{ marginTop: 22, background: "linear-gradient(180deg,#d71920,#a80f15)", color: "#fff", border: 0, borderRadius: 6, padding: "12px 26px", fontSize: 12, fontWeight: 600, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}
          >
            Reload the store
          </button>
        </main>
      </body>
    </html>
  );
}
