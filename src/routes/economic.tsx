import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel, PanelHeader, Chip, Kpi, Advisory, Segmented, Bar } from "@/components/dash/ui";
import { GroupedBars } from "@/components/dash/charts";
import { useSelection } from "@/lib/selection";
import { DEFAULT_INPUTS, SCENARIO_MULT, fmtUsd, simulate, type Scenario } from "@/lib/econ";
import { RANKED_STATIONS, RECOMMENDATIONS, bottleneckScore } from "@/lib/data";

const TITLE = "Economic Impact — Veridic Defect Root-Cause Assistant";
const DESC =
  "What-if simulator translating defect rate, rework share and bottleneck drag into scrap cost, rework cost and lost margin per day.";

export const Route = createFileRoute("/economic")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: EconomicPage,
});

const SLIDERS = [
  { key: "defectRate", label: "Defect rate", unit: "%", min: 0.5, max: 8, step: 0.1 },
  { key: "unitsPerShift", label: "Units per shift", unit: "u", min: 400, max: 2000, step: 20 },
  { key: "unitCost", label: "Unit cost", unit: "$", min: 5, max: 120, step: 1 },
  { key: "reworkShare", label: "Reworkable share", unit: "%", min: 0, max: 100, step: 1 },
  { key: "reworkCost", label: "Rework cost", unit: "$", min: 2, max: 60, step: 1 },
  { key: "marginPerUnit", label: "Margin per unit", unit: "$", min: 2, max: 90, step: 1 },
  { key: "throughputLossPct", label: "Throughput loss", unit: "%", min: 0, max: 12, step: 0.1 },
  { key: "shiftsPerDay", label: "Shifts per day", unit: "", min: 1, max: 3, step: 1 },
] as const;

function EconomicPage() {
  const { scenario, setScenario, econ, setEcon } = useSelection();
  const res = simulate(econ, scenario);
  const meta = SCENARIO_MULT[scenario];
  const all = (["low", "base", "high"] as Scenario[]).map((s) => {
    const r = simulate(econ, s);
    return { scenario: SCENARIO_MULT[s].label, scrap: Math.round(r.scrapCost), rework: Math.round(r.reworkCost), throughput: Math.round(r.throughputLossValue) };
  });
  const constraint = RANKED_STATIONS[0]!;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Defective units / day" value={Math.round(res.defectiveUnits).toLocaleString()} sub={`${(econ.defectRate * meta.defect).toFixed(1)}% effective rate`} subTone="defect" />
        <Kpi label="Scrap cost / day" value={fmtUsd(res.scrapCost, true)} sub={`${Math.round(res.scrapUnits)} units scrapped`} subTone="defect" />
        <Kpi label="Rework cost / day" value={fmtUsd(res.reworkCost, true)} sub={`${Math.round(res.reworkUnits)} units reworked`} subTone="warn" />
        <Kpi label="Net margin impact" value={fmtUsd(res.marginImpact, true)} sub="per day, all effects" subTone="defect" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <Panel className="lg:col-span-2" tilt="l">
          <PanelHeader title="Scenario" right={<Chip tone="warn">SIMULATED</Chip>} />
          <Segmented
            value={scenario}
            onChange={setScenario}
            options={[
              { value: "low", label: "Low" },
              { value: "base", label: "Base" },
              { value: "high", label: "High" },
            ]}
          />
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">{meta.note}</p>
          <div className="mt-3 space-y-3">
            {SLIDERS.map((s) => (
              <label key={s.key} className="block">
                <span className="flex items-baseline justify-between font-mono text-[10px]">
                  <span className="text-faint">{s.label}</span>
                  <span className="text-ink">
                    {econ[s.key]}
                    {s.unit}
                  </span>
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={econ[s.key]}
                  onChange={(e) => setEcon({ [s.key]: Number(e.target.value) })}
                  className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-signal"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEcon(DEFAULT_INPUTS)}
            className="mt-3 w-full rounded-md bg-panel2 py-2 font-mono text-[10px] uppercase tracking-wider text-dim ring-1 ring-line transition-colors hover:text-ink"
          >
            Reset to observed values
          </button>
        </Panel>

        <div className="space-y-3 lg:col-span-3">
          <Panel tilt="r">
            <PanelHeader title="Cost breakdown across scenarios" meta="$ per day" />
            <GroupedBars
              data={all}
              x="scenario"
              series={[
                { key: "scrap", color: "var(--defect)" },
                { key: "rework", color: "var(--warn)" },
                { key: "throughput", color: "var(--signal)" },
              ]}
              unit="$"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[9px] text-faint">
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-defect" />Scrap</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-warn" />Rework</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-signal" />Throughput loss</span>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Loss ledger" meta={`${meta.label} scenario`} />
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between"><span className="text-faint">Scrapped units</span><span className="text-dim">{Math.round(res.scrapUnits)} u</span></div>
              <div className="flex justify-between"><span className="text-faint">Scrap cost</span><span className="text-defect">{fmtUsd(res.scrapCost)}</span></div>
              <div className="flex justify-between"><span className="text-faint">Rework cost</span><span className="text-warn">{fmtUsd(res.reworkCost)}</span></div>
              <div className="flex justify-between"><span className="text-faint">Throughput loss ({constraint.name}, score {bottleneckScore(constraint)})</span><span className="text-dim">-{Math.round(res.throughputLossUnits)} u → {fmtUsd(res.throughputLossValue)}</span></div>
              <div className="flex justify-between border-t border-line pt-2"><span className="text-ink">Net margin impact / day</span><span className="text-[13px] font-semibold text-defect">{fmtUsd(res.marginImpact)}</span></div>
              <div className="flex justify-between"><span className="text-faint">Annualised (250 days)</span><span className="text-dim">{fmtUsd(res.marginImpact * 250, true)}</span></div>
            </div>
            <div className="mt-3">
              <Advisory>
                Estimates from simulated line data and the inputs above. Use for prioritising investigations, not for
                financial reporting.
              </Advisory>
            </div>
          </Panel>
        </div>
      </div>

      <Panel>
        <PanelHeader title="Recoverable value by recommendation" meta="base scenario" />
        <div className="space-y-2.5">
          {RECOMMENDATIONS.map((r) => (
            <div key={r.rank} className="grid grid-cols-12 items-center gap-3 font-mono text-[11px]">
              <span className="col-span-1 text-faint">#{r.rank}</span>
              <span className="col-span-5 truncate text-dim">{r.title}</span>
              <span className="col-span-4"><Bar value={(r.impactUsd / 9800) * 100} tone={r.rank === 1 ? "defect" : "signal"} /></span>
              <span className="col-span-2 text-right text-ink">{fmtUsd(r.impactUsd, true)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 font-mono text-[10px]">
          <Link to="/bottlenecks" className="text-signal hover:underline">← Bottlenecks</Link>
          <Link to="/recommendations" className="ml-auto text-signal hover:underline">Recommendations →</Link>
        </div>
      </Panel>
    </div>
  );
}
