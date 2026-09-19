import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
  type TooltipProps,
} from "recharts";

const tick = { fill: "var(--faint)", fontSize: 9, fontFamily: "var(--font-mono)" };
const grid = "color-mix(in oklab, var(--line) 60%, transparent)";

function Tip({ active, payload, label, unit }: TooltipProps<number, string> & { unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md bg-panel2 px-2.5 py-1.5 font-mono text-[10px] ring-1 ring-line">
      <div className="text-faint">{label}</div>
      {payload.map((p) => (
        <div key={String(p.name)} className="text-ink">
          {p.name}: <span className="font-semibold">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendBars({ data, x, y, threshold, unit = "%", height = 112 }: { data: Record<string, unknown>[]; x: string; y: string; threshold?: number; unit?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey={x} tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "color-mix(in oklab, var(--signal) 8%, transparent)" }} content={<Tip unit={unit} />} />
        {threshold !== undefined && <ReferenceLine y={threshold} stroke="var(--warn)" strokeDasharray="3 3" />}
        <Bar dataKey={y} radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={threshold !== undefined && Number(d[y]) > threshold ? "var(--defect)" : "color-mix(in oklab, var(--signal) 55%, transparent)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data, x, y, height = 140, unit = "" }: { data: Record<string, unknown>[]; x: string; y: string; height?: number; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: -28, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey={x} tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip unit={unit} />} />
        <Line type="monotone" dataKey={y} stroke="var(--signal)" strokeWidth={2} dot={{ r: 2, fill: "var(--signal)" }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ScatterBatches({ data, height = 200 }: { data: { id: string; x: number; y: number; z: number; changeover: boolean }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
        <CartesianGrid stroke={grid} />
        <XAxis type="number" dataKey="x" name="Avg cycle (s)" tick={tick} axisLine={false} tickLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
        <YAxis type="number" dataKey="y" name="Defect rate (%)" tick={tick} axisLine={false} tickLine={false} />
        <ZAxis type="number" dataKey="z" range={[60, 260]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "var(--line)" }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
            if (!active || !p) return null;
            return (
              <div className="rounded-md bg-panel2 px-2.5 py-1.5 font-mono text-[10px] ring-1 ring-line">
                <div className="text-ink font-semibold">{p.id}</div>
                <div className="text-dim">cycle {p.x}s · defect {p.y}% · downtime {p.z}m</div>
                <div className={p.changeover ? "text-defect" : "text-ok"}>{p.changeover ? "changeover batch" : "steady state"}</div>
              </div>
            );
          }}
        />
        <Scatter data={data}>
          {data.map((d) => (
            <Cell key={d.id} fill={d.changeover ? "var(--defect)" : "var(--signal)"} fillOpacity={0.85} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function GroupedBars({ data, x, series, height = 180, unit = "" }: { data: Record<string, unknown>[]; x: string; series: { key: string; color: string }[]; height?: number; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey={x} tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "color-mix(in oklab, var(--signal) 8%, transparent)" }} content={<Tip unit={unit} />} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[2, 2, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
