import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "jonkeen.dev — Jon Keen, Software Engineer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#050d10",
        color: "#e0f4f8",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 500,
          letterSpacing: "-0.04em",
          marginBottom: 12,
        }}
      >
        jonkeen.dev
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          color: "#7fb8c8",
          marginBottom: 8,
        }}
      >
        Jon Keen
      </div>
      <div
        style={{
          fontSize: 28,
          color: "#22d3ee",
          marginBottom: 32,
        }}
      >
        Software Engineer
      </div>
      {/* Cyan accent line */}
      <div
        style={{
          width: 120,
          height: 4,
          backgroundColor: "#22d3ee",
          borderRadius: 2,
        }}
      />
    </div>,
    {
      ...size,
    },
  );
}
