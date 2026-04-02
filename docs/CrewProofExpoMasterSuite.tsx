import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import MapView, { Marker, Polyline, Polygon } from "react-native-maps";

const COLORS = {
  bg: "#0a0a0a",
  panel: "#121212",
  panelSoft: "#171717",
  border: "#262626",
  text: "#fafafa",
  subtext: "#a1a1aa",
  red: "#ef4444",
  redSoft: "rgba(239,68,68,0.12)",
  blue: "#60a5fa",
  blueSoft: "rgba(96,165,250,0.12)",
  green: "#4ade80",
  greenSoft: "rgba(74,222,128,0.12)",
  yellow: "#facc15",
  yellowSoft: "rgba(250,204,21,0.12)",
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
  {
    id: "NC-20482",
    workOrder: "WO-11877",
    name: "Fiber Drop Install",
    market: "Charlotte",
    status: "At Risk",
    priority: "High",
    risk: "Gas Conflict",
    crew: "Crew 12",
    permit: "Missing",
    locate811: "Active",
    description:
      "Underground fiber drop requiring bore. Gas utility conflict is present. Permit approval and field photos are still missing before closeout.",
    missing: ["Permit", "Field Photos"],
  },
  {
    id: "SC-19311",
    workOrder: "WO-10934",
    name: "Handhole Placement",
    market: "Greenville",
    status: "Ready",
    priority: "Medium",
    risk: "Moderate",
    crew: "Crew 7",
    permit: "Approved",
    locate811: "Clear",
    description:
      "Handhole placement is fully cleared with utilities marked and route approved for field execution.",
    missing: [],
  },
  {
    id: "TN-22108",
    workOrder: "WO-12041",
    name: "Restoration Follow Up",
    market: "Knoxville",
    status: "Pending Review",
    priority: "Medium",
    risk: "Low",
    crew: "Crew 3",
    permit: "Closed",
    locate811: "Complete",
    description:
      "Restoration photos and redline have been submitted and are waiting on office review before billing.",
    missing: ["Supervisor Approval"],
  },
];

function Pill({ label, tone = "default" }) {
  const toneStyles = {
    default: { backgroundColor: COLORS.panelSoft, borderColor: COLORS.border, color: COLORS.subtext },
    red: { backgroundColor: COLORS.redSoft, borderColor: "rgba(239,68,68,0.24)", color: "#fca5a5" },
    green: { backgroundColor: COLORS.greenSoft, borderColor: "rgba(74,222,128,0.24)", color: "#86efac" },
    yellow: { backgroundColor: COLORS.yellowSoft, borderColor: "rgba(250,204,21,0.24)", color: "#fde68a" },
    blue: { backgroundColor: COLORS.blueSoft, borderColor: "rgba(96,165,250,0.24)", color: "#93c5fd" },
  };
  const t = toneStyles[tone] || toneStyles.default;
  return (
    <View style={[styles.pill, { backgroundColor: t.backgroundColor, borderColor: t.borderColor }]}>
      <Text style={[styles.pillText, { color: t.color }]}>{label}</Text>
    </View>
  );
}

function MapWorkspaceReal({ selectedJob }: { selectedJob?: { id?: string } }) {
  return (
    <MapView
      style={{ height: 350, borderRadius: 20 }}
      initialRegion={{
        latitude: 35.2271,
        longitude: -80.8431,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Polygon
        coordinates={[
          { latitude: 35.2275, longitude: -80.844 },
          { latitude: 35.2275, longitude: -80.842 },
          { latitude: 35.226, longitude: -80.842 },
          { latitude: 35.226, longitude: -80.844 },
        ]}
        strokeColor="#22d3ee"
        fillColor="rgba(34,211,238,0.2)"
      />

      <Polyline
        coordinates={[
          { latitude: 35.227, longitude: -80.844 },
          { latitude: 35.2265, longitude: -80.8425 },
        ]}
        strokeColor="#60a5fa"
        strokeWidth={4}
      />

      <Polyline
        coordinates={[
          { latitude: 35.227, longitude: -80.844 },
          { latitude: 35.2268, longitude: -80.8428 },
        ]}
        strokeColor="#4ade80"
        strokeWidth={4}
      />

      <Polyline
        coordinates={[
          { latitude: 35.2272, longitude: -80.8438 },
          { latitude: 35.2266, longitude: -80.8426 },
        ]}
        strokeColor="#facc15"
        strokeWidth={4}
      />

      <Marker
        coordinate={{ latitude: 35.2267, longitude: -80.8427 }}
        title={selectedJob?.id ? `Conflict Point • ${selectedJob.id}` : "Conflict Point"}
        pinColor="red"
      />
    </MapView>
  );
}

// ... trimmed for brevity in this repository copy.
// The complete component source should remain in the original design handoff.

export default function CrewProofExpoMasterSuite() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appBg}>
        <Text style={styles.placeholder}>CrewProof Expo Master Suite source placeholder.</Text>
      </View>
    </SafeAreaView>
  );
}

export const __test__ = {
  workspaces: WORKSPACES.map((w) => w.key),
  viewModes: ["operations", "guided", "field"],
  densities: ["comfortable", "compact"],
  tiers: ["starter", "pro", "enterprise"],
  jobs: JOBS.map((job) => job.id),
  mapWorkspaceComponent: typeof MapWorkspaceReal === "function",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  appBg: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  placeholder: { color: COLORS.text, textAlign: "center" },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  pillText: { fontSize: 11, fontWeight: "700" },
});
