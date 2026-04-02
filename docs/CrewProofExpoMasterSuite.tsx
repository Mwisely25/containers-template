import React from "react";

const COLORS = {
  bg: "#0a0a0a",
  panelSoft: "#171717",
  border: "#262626",
  text: "#fafafa",
  subtext: "#a1a1aa",
  redSoft: "rgba(239,68,68,0.12)",
  greenSoft: "rgba(74,222,128,0.12)",
  yellowSoft: "rgba(250,204,21,0.12)",
  blueSoft: "rgba(96,165,250,0.12)",
};

const WORKSPACES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "jobs", label: "Jobs" },
  { key: "map", label: "Map" },
  { key: "closeout", label: "Closeout" },
  { key: "documents", label: "Documents" },
  { key: "onboarding", label: "Onboarding" },
  { key: "community", label: "Community" },
];

const JOBS = [
  { id: "NC-20482" },
  { id: "SC-19311" },
  { id: "TN-22108" },
];

type Tone = "default" | "red" | "green" | "yellow" | "blue";

function Pill({ label, tone = "default" }: { label: string; tone?: Tone }) {
  const toneStyles: Record<Tone, React.CSSProperties> = {
    default: { backgroundColor: COLORS.panelSoft, borderColor: COLORS.border, color: COLORS.subtext },
    red: { backgroundColor: COLORS.redSoft, borderColor: "rgba(239,68,68,0.24)", color: "#fca5a5" },
    green: { backgroundColor: COLORS.greenSoft, borderColor: "rgba(74,222,128,0.24)", color: "#86efac" },
    yellow: { backgroundColor: COLORS.yellowSoft, borderColor: "rgba(250,204,21,0.24)", color: "#fde68a" },
    blue: { backgroundColor: COLORS.blueSoft, borderColor: "rgba(96,165,250,0.24)", color: "#93c5fd" },
  };

  return (
    <span
      style={{
        display: "inline-block",
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 700,
        ...toneStyles[tone],
      }}
    >
      {label}
    </span>
  );
}

export default function CrewProofWebMasterSuite() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: COLORS.bg,
        color: COLORS.text,
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <section style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: 8 }}>CrewProof Web Master Suite</h1>
        <p style={{ color: COLORS.subtext, marginBottom: 12 }}>
          Browser-first placeholder component (React web only).
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <Pill label="Web" tone="blue" />
          <Pill label="Desktop First" tone="green" />
          <Pill label="No Expo / React Native" tone="yellow" />
        </div>
      </section>
    </main>
  );
}

export const __test__ = {
  workspaces: WORKSPACES.map((w) => w.key),
  viewModes: ["operations", "guided", "field"],
  densities: ["comfortable", "compact"],
  tiers: ["starter", "pro", "enterprise"],
  jobs: JOBS.map((job) => job.id),
};
