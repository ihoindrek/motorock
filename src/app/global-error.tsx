"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-paper font-body text-ink antialiased">
        <div
          style={{
            maxWidth: "40rem",
            margin: "0 auto",
            padding: "4rem 1.25rem",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#FF6813",
            }}
          >
            Motorock.eu
          </p>
          <h1 style={{ marginTop: "1rem", fontSize: "2rem", fontWeight: 800 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "1rem", lineHeight: 1.6, color: "rgb(11 11 11 / 0.65)" }}>
            The application encountered an unexpected error. You can try reloading
            this page.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "2rem",
              border: "none",
              background: "#FF6813",
              color: "#FAF8F6",
              padding: "0.75rem 1.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
