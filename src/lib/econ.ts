export type Scenario = "low" | "base" | "high";

export interface EconInputs {
  defectRate: number; // %
  unitsPerShift: number;
  unitCost: number; // $ material+labour per unit
  reworkShare: number; // % of defects that can be reworked
  reworkCost: number; // $ per reworked unit
  marginPerUnit: number; // $ contribution margin per good unit
  throughputLossPct: number; // % of capacity lost at bottleneck
  shiftsPerDay: number;
}

export const DEFAULT_INPUTS: EconInputs = {
  defectRate: 4.2,
  unitsPerShift: 1260,
  unitCost: 38,
  reworkShare: 35,
  reworkCost: 14,
  marginPerUnit: 22,
  throughputLossPct: 3.2,
  shiftsPerDay: 3,
};

export const SCENARIO_MULT: Record<Scenario, { label: string; defect: number; loss: number; cost: number; note: string }> = {
  low: { label: "Low", defect: 0.75, loss: 0.6, cost: 0.9, note: "Optimistic: defect rate reverts toward baseline, mild throughput drag" },
  base: { label: "Base", defect: 1, loss: 1, cost: 1, note: "Current observed rates persist for the period" },
  high: { label: "High", defect: 1.35, loss: 1.5, cost: 1.1, note: "Pessimistic: drift continues, bottleneck drag compounds" },
};

export interface EconResult {
  defectiveUnits: number;
  scrapUnits: number;
  reworkUnits: number;
  scrapCost: number;
  reworkCost: number;
  throughputLossUnits: number;
  throughputLossValue: number;
  marginImpact: number;
}

export function simulate(inputs: EconInputs, scenario: Scenario): EconResult {
  const m = SCENARIO_MULT[scenario];
  const unitsDay = inputs.unitsPerShift * inputs.shiftsPerDay;
  const rate = (inputs.defectRate * m.defect) / 100;
  const defectiveUnits = unitsDay * rate;
  const reworkUnits = defectiveUnits * (inputs.reworkShare / 100);
  const scrapUnits = defectiveUnits - reworkUnits;
  const scrapCost = scrapUnits * inputs.unitCost * m.cost;
  const reworkCost = reworkUnits * inputs.reworkCost * m.cost;
  const throughputLossUnits = unitsDay * ((inputs.throughputLossPct * m.loss) / 100);
  const throughputLossValue = throughputLossUnits * inputs.marginPerUnit;
  const marginImpact = -(scrapCost + reworkCost + throughputLossValue + scrapUnits * inputs.marginPerUnit);
  return { defectiveUnits, scrapUnits, reworkUnits, scrapCost, reworkCost, throughputLossUnits, throughputLossValue, marginImpact };
}

export const fmtUsd = (n: number, compact = false) =>
  compact
    ? (Math.abs(n) >= 1000 ? `${n < 0 ? "-" : ""}$${(Math.abs(n) / 1000).toFixed(1)}K` : `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(0)}`)
    : `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;
