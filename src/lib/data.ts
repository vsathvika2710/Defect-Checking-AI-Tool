import imgBracket from "@/assets/insp-bracket-crack.jpg";
import imgPcb from "@/assets/insp-pcb-solder.jpg";
import imgHousing from "@/assets/insp-housing-ok.jpg";
import imgPlastic from "@/assets/insp-plastic-novel.jpg";
import imgWeld from "@/assets/insp-weld-porosity.jpg";

export type Verdict = "accepted" | "defective" | "review" | "novel";

export const VERDICT_META: Record<Verdict, { label: string; tone: "ok" | "defect" | "warn" | "signal" }> = {
  accepted: { label: "Accepted", tone: "ok" },
  defective: { label: "Defective", tone: "defect" },
  review: { label: "Requires Review", tone: "warn" },
  novel: { label: "Potential Novel Defect", tone: "signal" },
};

export interface Station {
  id: string;
  name: string;
  cycleTime: number; // seconds
  takt: number; // seconds
  utilization: number; // %
  wip: number; // units queued
  downtimeMin: number; // per shift
  changeoverMin: number; // per shift
  defectShare: number; // % of defects attributed
}

export const STATIONS: Station[] = [
  { id: "press-02", name: "Press 02", cycleTime: 41, takt: 36, utilization: 98, wip: 42, downtimeMin: 34, changeoverMin: 28, defectShare: 46 },
  { id: "weld-05", name: "Weld 05", cycleTime: 38, takt: 36, utilization: 91, wip: 27, downtimeMin: 21, changeoverMin: 12, defectShare: 24 },
  { id: "asm-01", name: "Assembly 01", cycleTime: 33, takt: 36, utilization: 84, wip: 18, downtimeMin: 9, changeoverMin: 6, defectShare: 14 },
  { id: "smt-b", name: "SMT-B Reflow", cycleTime: 35, takt: 36, utilization: 88, wip: 22, downtimeMin: 15, changeoverMin: 18, defectShare: 11 },
  { id: "insp-03", name: "Inspect 03", cycleTime: 29, takt: 36, utilization: 61, wip: 9, downtimeMin: 4, changeoverMin: 0, defectShare: 5 },
];

export function bottleneckScore(s: Station) {
  const cycleOver = Math.max(0, (s.cycleTime - s.takt) / s.takt); // 0..
  const score =
    0.35 * Math.min(1, cycleOver / 0.2) +
    0.25 * (s.utilization / 100) +
    0.2 * Math.min(1, s.wip / 45) +
    0.12 * Math.min(1, s.downtimeMin / 40) +
    0.08 * Math.min(1, s.changeoverMin / 30);
  return Math.round(score * 100);
}

export const RANKED_STATIONS = [...STATIONS].sort((a, b) => bottleneckScore(b) - bottleneckScore(a));

export interface Batch {
  id: string;
  stationId: string;
  units: number;
  defectRate: number; // %
  avgCycle: number; // s
  downtimeMin: number;
  changeover: boolean;
  temp: number; // °C process temp
  shift: number;
}

export const BATCHES: Batch[] = [
  { id: "B-2288", stationId: "press-02", units: 1180, defectRate: 2.1, avgCycle: 37, downtimeMin: 6, changeover: false, temp: 182, shift: 1 },
  { id: "B-2301", stationId: "press-02", units: 1210, defectRate: 2.6, avgCycle: 38, downtimeMin: 9, changeover: false, temp: 184, shift: 2 },
  { id: "B-2315", stationId: "weld-05", units: 1160, defectRate: 1.9, avgCycle: 36, downtimeMin: 4, changeover: false, temp: 190, shift: 1 },
  { id: "B-2340", stationId: "press-02", units: 1240, defectRate: 3.0, avgCycle: 39, downtimeMin: 14, changeover: true, temp: 179, shift: 3 },
  { id: "B-2356", stationId: "asm-01", units: 1195, defectRate: 2.3, avgCycle: 34, downtimeMin: 7, changeover: false, temp: 186, shift: 2 },
  { id: "B-2372", stationId: "weld-05", units: 1230, defectRate: 3.3, avgCycle: 40, downtimeMin: 18, changeover: true, temp: 176, shift: 3 },
  { id: "B-2291", stationId: "press-02", units: 1260, defectRate: 4.2, avgCycle: 43, downtimeMin: 26, changeover: true, temp: 173, shift: 2 },
];

export interface Evidence {
  kind: "image" | "process" | "batch" | "history";
  text: string;
}

export interface Inspection {
  id: string;
  unitId: string;
  batchId: string;
  stationId: string;
  product: string;
  image: string;
  verdict: Verdict;
  defectClass: string | null;
  confidence: number; // 0..100
  uncertainty: number; // 0..100 (epistemic spread)
  novelty: number; // 0..100 distance from known classes
  bbox: { x: number; y: number; w: number; h: number } | null; // % of image
  sizeMm: string | null;
  capturedAt: string;
  evidence: Evidence[];
  process: { cycle: number; temp: number; sinceChangeoverMin: number; utilization: number };
}

export const INSPECTIONS: Inspection[] = [
  {
    id: "88213",
    unitId: "U-88213",
    batchId: "B-2291",
    stationId: "press-02",
    product: "Steel bracket SB-140",
    image: imgBracket,
    verdict: "defective",
    defectClass: "Structural crack",
    confidence: 92,
    uncertainty: 6,
    novelty: 12,
    bbox: { x: 44, y: 34, w: 14, h: 44 },
    sizeMm: "0.4 mm",
    capturedAt: "14:31:52",
    evidence: [
      { kind: "image", text: "Linear discontinuity through the central boss, 0.4 mm width, high-gradient edge response" },
      { kind: "batch", text: "Batch B-2291 defect rate 4.2% vs 2.4% 30-batch baseline (+1.8 pts)" },
      { kind: "process", text: "Unit produced 11 min after die changeover; press temp 173 °C (target 182 °C)" },
      { kind: "history", text: "9 of last 12 crack detections on Press 02 occurred within 25 min of a changeover" },
    ],
    process: { cycle: 43, temp: 173, sinceChangeoverMin: 11, utilization: 98 },
  },
  {
    id: "88174",
    unitId: "U-88174",
    batchId: "B-2372",
    stationId: "weld-05",
    product: "Tube joint TJ-22",
    image: imgWeld,
    verdict: "defective",
    defectClass: "Weld porosity",
    confidence: 84,
    uncertainty: 11,
    novelty: 18,
    bbox: { x: 30, y: 30, w: 40, h: 26 },
    sizeMm: "3 pits > 0.3 mm",
    capturedAt: "14:22:08",
    evidence: [
      { kind: "image", text: "Cluster of sub-surface pits along the bead toe; texture entropy 2.1σ above reference" },
      { kind: "batch", text: "Batch B-2372 defect rate 3.3%; shield-gas flow logged low for 14 min" },
      { kind: "process", text: "Weld 05 downtime 18 min this batch; changeover flag set" },
      { kind: "history", text: "Porosity share on Weld 05 rose from 8% to 19% over 5 batches" },
    ],
    process: { cycle: 40, temp: 176, sinceChangeoverMin: 22, utilization: 91 },
  },
  {
    id: "88240",
    unitId: "U-88240",
    batchId: "B-2340",
    stationId: "smt-b",
    product: "Controller PCB CP-7",
    image: imgPcb,
    verdict: "review",
    defectClass: "Solder bridge",
    confidence: 63,
    uncertainty: 24,
    novelty: 15,
    bbox: { x: 74, y: 50, w: 6, h: 9 },
    sizeMm: "0.6 mm span",
    capturedAt: "14:18:41",
    evidence: [
      { kind: "image", text: "Possible bridge across J3 pins 7–8; low contrast, confidence below 70% auto-threshold" },
      { kind: "process", text: "Reflow peak 4 °C below profile after changeover; paste lot changed this shift" },
      { kind: "history", text: "Model disagreement across 3 ensemble members (2 defective / 1 accepted)" },
    ],
    process: { cycle: 35, temp: 179, sinceChangeoverMin: 38, utilization: 88 },
  },
  {
    id: "88251",
    unitId: "U-88251",
    batchId: "B-2340",
    stationId: "asm-01",
    product: "Cover MC-3 (polymer)",
    image: imgPlastic,
    verdict: "novel",
    defectClass: null,
    confidence: 41,
    uncertainty: 37,
    novelty: 81,
    bbox: { x: 17, y: 12, w: 22, h: 40 },
    sizeMm: "~48 × 60 mm patch",
    capturedAt: "14:09:17",
    evidence: [
      { kind: "image", text: "Speckled texture region not matching any of 14 known defect classes (nearest: 'splay', d=0.81)" },
      { kind: "process", text: "Injection temp 186 °C nominal; no process excursion logged" },
      { kind: "history", text: "First occurrence on this product family; 2 similar unlabeled captures in the last 3 h" },
    ],
    process: { cycle: 34, temp: 186, sinceChangeoverMin: 140, utilization: 84 },
  },
  {
    id: "88262",
    unitId: "U-88262",
    batchId: "B-2356",
    stationId: "asm-01",
    product: "Gear housing GH-9",
    image: imgHousing,
    verdict: "accepted",
    defectClass: null,
    confidence: 97,
    uncertainty: 2,
    novelty: 4,
    bbox: null,
    sizeMm: null,
    capturedAt: "14:05:03",
    evidence: [
      { kind: "image", text: "No anomalies above threshold; surface roughness within tolerance" },
      { kind: "batch", text: "Batch B-2356 defect rate 2.3% (baseline)" },
    ],
    process: { cycle: 33, temp: 184, sinceChangeoverMin: 210, utilization: 84 },
  },
];

export interface Association {
  id: string;
  defectClass: string;
  variable: string;
  strength: number; // 0..1 correlation-like effect size
  n: number;
  direction: "+" | "-";
  note: string;
  stationId: string;
}

export const ASSOCIATIONS: Association[] = [
  { id: "a1", defectClass: "Structural crack", variable: "Minutes since changeover", strength: 0.82, n: 141, direction: "-", note: "Crack rate highest in the first 25 min after die changeover", stationId: "press-02" },
  { id: "a2", defectClass: "Structural crack", variable: "Press temperature", strength: 0.71, n: 141, direction: "-", note: "Lower press temp co-occurs with cracks; temp dips after changeover", stationId: "press-02" },
  { id: "a3", defectClass: "Structural crack", variable: "Cycle time", strength: 0.58, n: 141, direction: "+", note: "Longer cycles during ramp-up co-occur with cracks", stationId: "press-02" },
  { id: "a4", defectClass: "Weld porosity", variable: "Downtime (min)", strength: 0.66, n: 98, direction: "+", note: "Porosity rises after unplanned stops (gas purge suspected)", stationId: "weld-05" },
  { id: "a5", defectClass: "Weld porosity", variable: "Utilization", strength: 0.44, n: 98, direction: "+", note: "Weak link with high utilization", stationId: "weld-05" },
  { id: "a6", defectClass: "Solder bridge", variable: "Reflow peak temp", strength: 0.53, n: 76, direction: "-", note: "Bridges more frequent when peak is below profile", stationId: "smt-b" },
  { id: "a7", defectClass: "Solder bridge", variable: "Minutes since changeover", strength: 0.47, n: 76, direction: "-", note: "Moderate; overlaps with paste lot change", stationId: "smt-b" },
  { id: "a8", defectClass: "Misalignment", variable: "WIP queue", strength: 0.39, n: 64, direction: "+", note: "Weak; queue pressure at Assembly 01", stationId: "asm-01" },
];

export const PROCESS_VARIABLES = [
  "Minutes since changeover",
  "Press temperature",
  "Cycle time",
  "Downtime (min)",
  "Utilization",
  "Reflow peak temp",
  "WIP queue",
];
export const DEFECT_CLASSES = ["Structural crack", "Weld porosity", "Solder bridge", "Misalignment"];

export const TREND_14D = [
  { day: "D1", rate: 2.1 }, { day: "D2", rate: 2.3 }, { day: "D3", rate: 1.9 }, { day: "D4", rate: 2.4 },
  { day: "D5", rate: 2.2 }, { day: "D6", rate: 2.8 }, { day: "D7", rate: 2.5 }, { day: "D8", rate: 2.6 },
  { day: "D9", rate: 3.1 }, { day: "D10", rate: 2.9 }, { day: "D11", rate: 3.4 }, { day: "D12", rate: 3.2 },
  { day: "D13", rate: 3.8 }, { day: "D14", rate: 4.2 },
];

export const DEFECT_MIX = [
  { name: "Structural crack", value: 46 },
  { name: "Weld porosity", value: 24 },
  { name: "Solder bridge", value: 14 },
  { name: "Misalignment", value: 11 },
  { name: "Unclassified", value: 5 },
];

export const CHANGEOVER_WINDOW = [
  { window: "0–10", rate: 6.1 }, { window: "10–20", rate: 5.2 }, { window: "20–30", rate: 3.6 },
  { window: "30–45", rate: 2.7 }, { window: "45–60", rate: 2.2 }, { window: "60+", rate: 2.0 },
];

export interface Recommendation {
  rank: number;
  title: string;
  detail: string;
  defectClass: string;
  inspectionId: string;
  stationId: string;
  associationId: string;
  linkConfidence: number;
  effort: "Low" | "Medium" | "High";
  impactUsd: number; // base scenario recoverable/day
  actions: string[];
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    rank: 1,
    title: "Verify Press 02 die alignment and warm-up profile after changeover",
    detail: "Crack detections cluster in the first 25 minutes after die changeover on the line's primary constraint. Confirm whether the ramp-up procedure is being skipped and whether press temperature stabilises before release.",
    defectClass: "Structural crack",
    inspectionId: "88213",
    stationId: "press-02",
    associationId: "a1",
    linkConfidence: 71,
    effort: "Medium",
    impactUsd: 9800,
    actions: ["Pull changeover logs for B-2291 and B-2340", "Compare temp traces for first 30 min vs steady state", "Hold first 20 units post-changeover for 100% inspection"],
  },
  {
    rank: 2,
    title: "Check Weld 05 shield-gas purge after unplanned stops",
    detail: "Porosity share rose across five batches and tracks downtime minutes. A gas-line purge or flow sensor fault after restarts is a plausible mechanism that fits the evidence.",
    defectClass: "Weld porosity",
    inspectionId: "88174",
    stationId: "weld-05",
    associationId: "a4",
    linkConfidence: 62,
    effort: "Low",
    impactUsd: 3900,
    actions: ["Review flow-meter logs around each stop in B-2372", "Trial forced 30 s purge on restart", "Re-inspect 50 units from post-stop windows"],
  },
  {
    rank: 3,
    title: "Escalate 3 low-confidence SMT-B bridges for manual review; audit reflow peak",
    detail: "Confidence sits below the auto-decision threshold with ensemble disagreement. Manual review resolves the queue; the reflow peak running 4 °C low is worth checking against the new paste lot.",
    defectClass: "Solder bridge",
    inspectionId: "88240",
    stationId: "smt-b",
    associationId: "a6",
    linkConfidence: 48,
    effort: "Low",
    impactUsd: 1400,
    actions: ["Manual review of queue items 88240, 88244, 88249", "Verify reflow profile vs paste lot datasheet", "Label outcomes to retrain the class"],
  },
  {
    rank: 4,
    title: "Label the novel texture pattern on Cover MC-3 and sample the last 3 hours",
    detail: "The model sees a pattern unlike any known class. This is a data-collection recommendation: it should not be treated as a confirmed defect until labelled by an engineer.",
    defectClass: "Unclassified (novel)",
    inspectionId: "88251",
    stationId: "asm-01",
    associationId: "a8",
    linkConfidence: 30,
    effort: "Low",
    impactUsd: 600,
    actions: ["Engineer labels 3 captured samples", "Check resin lot and dryer humidity", "Enable novelty watch on MC-3 for 24 h"],
  },
];

export const stationById = (id: string) => STATIONS.find((s) => s.id === id)!;
export const batchById = (id: string) => BATCHES.find((b) => b.id === id)!;
export const inspectionById = (id: string) => INSPECTIONS.find((i) => i.id === id) ?? INSPECTIONS[0]!;
export const associationById = (id: string) => ASSOCIATIONS.find((a) => a.id === id)!;
