import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "ok" | "defect" | "warn" | "signal" | "dim";

export const toneText: Record<Tone, string> = {
  ok: "text-ok",
  defect: "text-defect",
  warn: "text-warn",
  signal: "text-signal",
  dim: "text-dim",
};
export const toneBg: Record<Tone, string> = {
  ok: "bg-ok",
  defect: "bg-defect",
  warn: "bg-warn",
  signal: "bg-signal",
  dim: "bg-dim",
};
export const toneChip: Record<Tone, string> = {
  ok: "bg-ok/12 text-ok ring-ok/30",
  defect: "bg-defect/12 text-defect ring-defect/30",
  warn: "bg-warn/12 text-warn ring-warn/30",
  signal: "bg-signal/12 text-signal ring-signal/30",
  dim: "bg-panel2 text-dim ring-line",
};

export function Panel({ children, className, tilt }: { children: ReactNode; className?: string; tilt?: "l" | "r" }) {
  return (
    <section
      className={cn(
        "glass rounded-xl p-4 rise-in",
        tilt === "l" && "xl:rotate-[-0.35deg]",
        tilt === "r" && "xl:rotate-[0.35deg]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({ title, meta, right }: { title: string; meta?: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="font-mono text-[11px] uppercase tracking-wider text-dim">{title}</div>
      {right ?? (meta && <div className="label-mono">{meta}</div>)}
    </div>
  );
}

export function Chip({ tone = "dim", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[9px] ring-1 whitespace-nowrap", toneChip[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ring-1", toneChip[tone])}>
      {children}
    </span>
  );
}

export function Bar({ value, tone = "signal", className }: { value: number; tone?: Tone; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-line/70", className)}>
      <div className={cn("bar-fill h-full rounded-full", toneBg[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Kpi({ label, value, unit, sub, subTone = "dim", bar }: { label: string; value: string; unit?: string; sub?: string; subTone?: Tone; bar?: number }) {
  return (
    <div className="rounded-lg bg-panel p-3.5 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:ring-dim/50">
      <div className="label-mono">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("font-mono text-2xl font-semibold tracking-tight", subTone === "defect" && "text-defect")}>{value}</span>
        {unit && <span className="font-mono text-sm text-dim">{unit}</span>}
      </div>
      {bar !== undefined ? <Bar value={bar} className="mt-2 h-1" /> : sub && <div className={cn("mt-1 font-mono text-[10px]", toneText[subTone])}>{sub}</div>}
    </div>
  );
}

export function Advisory({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-warn/8 px-3 py-2 ring-1 ring-warn/25">
      <span className="pulse-dot mt-1 size-1.5 shrink-0 rounded-full bg-warn" />
      <p className="font-mono text-[10px] leading-relaxed text-warn">
        {children ?? "Simulated / advisory. Relationships shown are statistical associations, not proven causation."}
      </p>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md py-1.5 font-mono text-[10px] uppercase tracking-wider ring-1 transition-colors",
            value === o.value ? "bg-signal/20 font-semibold text-signal ring-signal/50" : "bg-panel2 text-dim ring-line hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
